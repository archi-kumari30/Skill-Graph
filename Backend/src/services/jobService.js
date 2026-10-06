const mongoose = require('mongoose');
const Job = require('../models/Job');
const UserSkill = require('../models/UserSkill');
const User = require('../models/User');
const Company = require('../models/Company');
const Skill = require('../models/Skill');
const SkillRelationship = require('../models/SkillRelationship');
const Topic = require('../models/Topic');
const UserTopicProgress = require('../models/UserTopicProgress');
const LearningResource = require('../models/LearningResource');
const JobApplication = require('../models/JobApplication');
const graphService = require('./graphService');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/customErrors');
const { formatPaginatedResponse } = require('../utils/helpers');

const LEARNING_TOPICS_FALLBACK = {
  'JavaScript': [
    { title: 'Variables & Data Types', summary: 'Understand const, let, primitives, and object references.', order: 1, difficulty: 'beginner' },
    { title: 'Functions & Closures', summary: 'Arrow functions, higher-order functions, and lexical scope.', order: 2, difficulty: 'beginner' },
    { title: 'Asynchronous JavaScript', summary: 'Promises, async/await, and event loop mechanics.', order: 3, difficulty: 'intermediate' },
    { title: 'DOM & Web APIs', summary: 'Event propagation, manipulating elements, and fetch API.', order: 4, difficulty: 'intermediate' }
  ],
  'React': [
    { title: 'Components & JSX', summary: 'Functional components, props passing, and JSX markup.', order: 1, difficulty: 'beginner' },
    { title: 'State & Lifecycle Hooks', summary: 'useState, useEffect, and component lifecycle.', order: 2, difficulty: 'beginner' },
    { title: 'Custom Hooks & Context', summary: 'Sharing logic with custom hooks and React Context API.', order: 3, difficulty: 'intermediate' },
    { title: 'Performance & Optimization', summary: 'useMemo, useCallback, and virtual DOM rendering.', order: 4, difficulty: 'advanced' }
  ],
  'Java': [
    { title: 'Java Syntax & Basics', summary: 'Data types, control structures, and methods.', order: 1, difficulty: 'beginner' },
    { title: 'Object-Oriented Programming', summary: 'Classes, encapsulation, inheritance, and polymorphism.', order: 2, difficulty: 'intermediate' },
    { title: 'Collections Framework', summary: 'List, Set, Map, and Stream operations.', order: 3, difficulty: 'intermediate' },
    { title: 'Concurrency & Multithreading', summary: 'Threads, synchronization, and executor service.', order: 4, difficulty: 'advanced' }
  ],
  'DSA': [
    { title: 'Arrays & Strings', summary: 'Two pointers, sliding window, and string manipulation.', order: 1, difficulty: 'beginner' },
    { title: 'Linked Lists & Stacks & Queues', summary: 'Core sequential data structures and pointer operations.', order: 2, difficulty: 'intermediate' },
    { title: 'Trees & Graphs', summary: 'Binary trees, BST, BFS, and DFS traversals.', order: 3, difficulty: 'advanced' },
    { title: 'Dynamic Programming', summary: 'Memoization, tabulation, and optimal substructure.', order: 4, difficulty: 'advanced' }
  ],
  'SQL': [
    { title: 'Relational Queries & CRUD', summary: 'SELECT, INSERT, UPDATE, DELETE and WHERE clauses.', order: 1, difficulty: 'beginner' },
    { title: 'Joins & Aggregations', summary: 'INNER/LEFT/RIGHT JOINs, GROUP BY, and aggregate functions.', order: 2, difficulty: 'intermediate' },
    { title: 'Indexes & Query Optimization', summary: 'B-tree indexes, execution plans, and normalization.', order: 3, difficulty: 'advanced' }
  ],
  'Node.js': [
    { title: 'Runtime & Event Loop', summary: 'Non-blocking I/O, event loop phases, and modules.', order: 1, difficulty: 'beginner' },
    { title: 'File System & Streams', summary: 'Buffer, fs module, and readable/writable streams.', order: 2, difficulty: 'intermediate' },
    { title: 'HTTP & REST APIs', summary: 'Building REST endpoints and managing request flows.', order: 3, difficulty: 'intermediate' }
  ]
};

const DEFAULT_FALLBACK_TOPICS = [
  { title: 'Foundations & Core Principles', summary: 'Key terminology, concepts, and architectural foundations.', order: 1, difficulty: 'beginner' },
  { title: 'Practical Implementation', summary: 'Hands-on techniques, problem-solving, and workflow execution.', order: 2, difficulty: 'intermediate' },
  { title: 'Advanced Patterns & Best Practices', summary: 'Optimization, debugging, scaling, and industry patterns.', order: 3, difficulty: 'advanced' }
];

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const getImportanceWeight = (importance) => {
  const imp = (importance || '').toLowerCase().replace(/\s+/g, '_');
  if (imp === 'required') return 3;
  if (imp === 'important') return 2;
  if (imp === 'nice_to_have') return 1;
  return 2;
};

const generateJobMatchExplanation = (title, matchScore, matchedCount, missingCount, improveCount, blockedCount = 0) => {
  if (matchScore >= 80) {
    return `Excellent match (Score: ${matchScore}%). You satisfy almost all core required proficiencies for the ${title} position. You have ${matchedCount} mastered requirements and only need minor adjustments.`;
  } else if (matchScore >= 50) {
    let extra = '';
    if (blockedCount > 0) {
      extra = ` ${blockedCount} skill(s) are currently blocked by missing prerequisites.`;
    }
    return `Good match (Score: ${matchScore}%). You meet several requirements for ${title}, but there are ${missingCount} missing skill(s) and ${improveCount} skill(s) that require proficiency upgrades.${extra}`;
  } else {
    let extra = '';
    if (blockedCount > 0) {
      extra = ` You have ${blockedCount} blocked skill(s) requiring foundational prerequisites first.`;
    }
    return `Gap warning (Score: ${matchScore}%). There is a significant divergence between your current profile and the required skill levels. You are missing ${missingCount} key skill(s).${extra} We recommend completing the prerequisite learning paths first.`;
  }
};

// Existing calculation for backward-compatibility with catalog tests
const calculateJobMatch = (job, userSkillMap) => {
  const reqs = job.requirements || [];
  if (reqs.length === 0) {
    return {
      matchScore: 100,
      matchedSkills: 0,
      missingSkills: 0,
      skillsToImprove: 0,
      skills: []
    };
  }

  let totalScore = 0;
  let matchedCount = 0;
  let missingCount = 0;
  let improveCount = 0;

  const skillDetails = reqs.map(req => {
    const skill = req.skillId;
    if (!skill) return null;
    const skillIdStr = skill._id ? skill._id.toString() : skill.toString();
    const prof = userSkillMap[skillIdStr] || 0;

    let score = 0;
    let status = 'missing';

    if (prof >= 3) {
      score = 1.0;
      status = 'mastered';
      matchedCount++;
    } else if (prof >= 1) {
      score = 0.5;
      status = 'needs_improvement';
      improveCount++;
    } else {
      score = 0;
      status = 'missing';
      missingCount++;
    }

    totalScore += score;

    return {
      skill: skill._id ? {
        id: skill._id,
        name: skill.name,
        category: skill.category
      } : { id: skill },
      currentProficiency: prof,
      requiredProficiency: req.requiredProficiency || req.expectedProficiency || 3,
      score,
      status
    };
  }).filter(Boolean);

  const totalReqs = skillDetails.length;
  const matchScore = totalReqs > 0 ? Math.round((totalScore / totalReqs) * 100) : 100;

  return {
    matchScore,
    matchedSkills: matchedCount,
    missingSkills: missingCount,
    skillsToImprove: improveCount,
    skills: skillDetails
  };
};

/**
 * Detailed Prerequisite Graph Analysis for a Job
 * Performs real DAG traversal to identify matched, partial, missing, and blocked skills.
 */
const analyzeJobWithPrerequisites = async (job, userSkillMap) => {
  const reqs = job.requirements || [];
  if (reqs.length === 0) {
    return {
      matchScore: 100,
      matchedSkills: [],
      partialSkills: [],
      missingSkills: [],
      blockedSkills: [],
      skillGaps: [],
      explanation: 'No skill requirements specified for this job position.'
    };
  }

  // Fetch all prerequisite relationships
  const relationships = await SkillRelationship.find({ relationshipType: 'prerequisite' })
    .populate('sourceSkillId', 'name category')
    .populate('targetSkillId', 'name category')
    .lean();

  // Build prerequisite adjacency: targetSkillId -> list of sourceSkillIds (prerequisites)
  const prereqMap = {};
  relationships.forEach(rel => {
    if (rel.sourceSkillId && rel.targetSkillId) {
      const targetId = rel.targetSkillId._id.toString();
      if (!prereqMap[targetId]) prereqMap[targetId] = [];
      prereqMap[targetId].push(rel.sourceSkillId);
    }
  });

  // Recursive check for unsatisfied prerequisite chain
  const findPrerequisiteChain = (targetSkillId, visited = new Set()) => {
    if (visited.has(targetSkillId)) return [];
    visited.add(targetSkillId);

    const directPrereqs = prereqMap[targetSkillId] || [];
    const missingChains = [];

    for (const prereq of directPrereqs) {
      const pId = prereq._id.toString();
      const pProf = userSkillMap[pId] || 0;
      if (pProf < 2) {
        // Prerequisite not satisfied; find what it requires recursively
        const subRequires = findPrerequisiteChain(pId, new Set(visited));
        missingChains.push({
          skillId: pId,
          name: prereq.name,
          category: prereq.category,
          currentProficiency: pProf,
          requires: subRequires.map(s => s.name)
        });
      }
    }
    return missingChains;
  };

  let totalWeightedScore = 0;
  let totalMaxWeight = 0;

  const matchedSkills = [];
  const partialSkills = [];
  const missingSkills = [];
  const blockedSkills = [];
  const skillGaps = [];

  for (const req of reqs) {
    const skill = req.skillId;
    if (!skill) continue;

    const skillIdStr = skill._id ? skill._id.toString() : skill.toString();
    const skillName = skill.name || 'Skill';
    const skillCategory = skill.category || 'General';
    const currentProf = userSkillMap[skillIdStr] || 0;
    const expectedProf = req.expectedProficiency || req.requiredProficiency || 3;
    const importance = req.importance || 'required';
    const weight = getImportanceWeight(importance);

    totalMaxWeight += weight;

    // Check prerequisites
    const missingPrereqs = findPrerequisiteChain(skillIdStr);
    const directPrereqs = (prereqMap[skillIdStr] || []).map(p => p.name);

    let status = 'missing';
    let contribution = 0;

    if (currentProf >= expectedProf) {
      status = 'matched';
      contribution = 1.0;
      matchedSkills.push({
        id: skillIdStr,
        name: skillName,
        category: skillCategory,
        importance,
        currentProficiency: currentProf,
        expectedProficiency: expectedProf,
        status: 'matched'
      });
    } else if (currentProf > 0) {
      status = 'partial';
      contribution = Math.min(1.0, currentProf / expectedProf);
      const gap = expectedProf - currentProf;
      const partialObj = {
        id: skillIdStr,
        name: skillName,
        category: skillCategory,
        importance,
        currentProficiency: currentProf,
        expectedProficiency: expectedProf,
        gap,
        prerequisites: directPrereqs,
        status: 'partial'
      };
      partialSkills.push(partialObj);
      skillGaps.push(partialObj);
    } else if (missingPrereqs.length > 0) {
      status = 'blocked';
      contribution = 0;
      const blockedObj = {
        id: skillIdStr,
        name: skillName,
        category: skillCategory,
        importance,
        currentProficiency: currentProf,
        expectedProficiency: expectedProf,
        gap: expectedProf,
        status: 'blocked',
        blockedBy: missingPrereqs
      };
      blockedSkills.push(blockedObj);
      skillGaps.push(blockedObj);
    } else {
      status = 'missing';
      contribution = 0;
      const missingObj = {
        id: skillIdStr,
        name: skillName,
        category: skillCategory,
        importance,
        currentProficiency: currentProf,
        expectedProficiency: expectedProf,
        gap: expectedProf,
        status: 'missing',
        prerequisitesStatus: 'Satisfied'
      };
      missingSkills.push(missingObj);
      skillGaps.push(missingObj);
    }

    totalWeightedScore += (weight * contribution);
  }

  const matchScore = totalMaxWeight > 0
    ? Math.round((totalWeightedScore / totalMaxWeight) * 100)
    : 100;

  const explanation = generateJobMatchExplanation(
    job.title,
    matchScore,
    matchedSkills.length,
    missingSkills.length,
    partialSkills.length,
    blockedSkills.length
  );

  return {
    matchScore,
    matchedSkills,
    partialSkills,
    missingSkills,
    blockedSkills,
    skillGaps,
    explanation
  };
};

const getJobs = async (filters = {}, actorUser) => {
  const query = {};

  // Recruiter Isolation: Recruiters only view their own posted jobs
  if (actorUser && (actorUser.accountRole === 'recruiter' || actorUser.accountRole === 'manager')) {
    query.recruiterId = actorUser._id;
  } else if (filters.recruiterId && actorUser && actorUser.accountRole === 'admin') {
    query.recruiterId = filters.recruiterId;
  }

  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  if (filters.location) {
    query.location = { $regex: filters.location, $options: 'i' };
  }

  if (filters.employmentType) {
    query.$or = [
      { employmentType: filters.employmentType },
      { jobType: filters.employmentType }
    ];
  }

  if (filters.workMode) {
    query.workMode = { $regex: new RegExp(`^${filters.workMode}$`, 'i') };
  }

  if (filters.status) {
    query.status = { $regex: new RegExp(`^${filters.status}$`, 'i') };
  }

  if (filters.experienceLevel) {
    query.experienceLevel = filters.experienceLevel;
  }

  if (filters.minSalary !== undefined && filters.minSalary !== null && filters.minSalary !== '') {
    query.$or = [
      { salaryMin: { $gte: Number(filters.minSalary) } },
      { salaryMax: { $gte: Number(filters.minSalary) } }
    ];
  }

  if (filters.maxSalary !== undefined && filters.maxSalary !== null && filters.maxSalary !== '') {
    const maxVal = Number(filters.maxSalary);
    if (query.$or) {
      query.$and = [
        { $or: query.$or },
        { salaryMin: { $lte: maxVal } }
      ];
      delete query.$or;
    } else {
      query.salaryMin = { $lte: maxVal };
    }
  }

  if (filters.page || filters.limit) {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Job.find(query)
        .populate('companyId')
        .populate('requirements.skillId')
        .populate('recruiterId', 'name email company')
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(query)
    ]);

    return formatPaginatedResponse(items, total, page, limit);
  }

  const jobs = await Job.find(query)
    .populate('companyId')
    .populate('requirements.skillId')
    .populate('recruiterId', 'name email company')
    .sort({ postedAt: -1 });

  return jobs;
};

const getJobById = async (jobId) => {
  const job = await Job.findById(jobId)
    .populate('companyId')
    .populate('requirements.skillId')
    .populate('recruiterId', 'name email company');

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  return job;
};

const getJobMatches = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const userSkills = await UserSkill.find({ userId });
  const userSkillMap = {};
  userSkills.forEach(us => {
    if (us.skillId) {
      userSkillMap[us.skillId.toString()] = us.proficiency;
    }
  });

  const jobs = await Job.find()
    .populate('companyId')
    .populate('requirements.skillId');

  const userApplications = await JobApplication.find({ userId }).lean();
  const appMap = {};
  userApplications.forEach(app => {
    if (app.jobId) {
      appMap[app.jobId.toString()] = {
        hasApplied: true,
        applicationId: app._id,
        status: app.status,
        appliedAt: app.appliedAt || app.createdAt
      };
    }
  });

  const matches = [];

  for (const job of jobs) {
    const analysis = calculateJobMatch(job, userSkillMap);
    const appInfo = appMap[job._id.toString()];

    matches.push({
      jobId: job._id,
      hasApplied: !!appInfo,
      applicationStatus: appInfo ? appInfo.status : null,
      appliedAt: appInfo ? appInfo.appliedAt : null,
      applicationId: appInfo ? appInfo.applicationId : null,
      title: job.title,
      company: {
        id: job.companyId?._id,
        name: job.companyId?.name || job.companyName || 'Unknown Company',
        description: job.companyId?.description,
        industry: job.companyId?.industry,
        website: job.companyId?.website,
        location: job.companyId?.location
      },
      description: job.description,
      location: job.location,
      workMode: job.workMode || 'Hybrid',
      employmentType: job.employmentType,
      jobType: job.jobType || job.employmentType,
      experienceLevel: job.experienceLevel,
      experience: job.experience || job.experienceLevel,
      salaryRange: job.salaryRange || job.salary,
      salary: job.salary || job.salaryRange,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
      status: job.status || 'Active',
      deadline: job.deadline,
      matchScore: analysis.matchScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      skillsToImprove: analysis.skillsToImprove,
      skills: analysis.skills,
      explanation: generateJobMatchExplanation(
        job.title,
        analysis.matchScore,
        analysis.matchedSkills,
        analysis.missingSkills,
        analysis.skillsToImprove
      ),
      source: job.source,
      sourceUrl: job.sourceUrl || job.applicationUrl
    });

    if (analysis.matchScore >= 80) {
      const notificationService = require('./notificationService');
      notificationService.notifyHighMatchJob({
        studentId: userId,
        job,
        matchScore: analysis.matchScore
      }).catch(err => console.error('Failed to dispatch high match notification:', err));
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
};

/**
 * Detailed Match Analysis for a specific job and user
 */
const getJobMatchForUser = async (userId, jobId) => {
  const job = await Job.findById(jobId)
    .populate('companyId')
    .populate('requirements.skillId');

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const userSkills = await UserSkill.find({ userId });
  const userSkillMap = {};
  userSkills.forEach(us => {
    if (us.skillId) {
      userSkillMap[us.skillId.toString()] = us.proficiency;
    }
  });

  const analysis = await analyzeJobWithPrerequisites(job, userSkillMap);

  // Check if current user has already applied
  const application = await JobApplication.findOne({ userId, jobId });

  return {
    job: {
      id: job._id,
      title: job.title,
      company: {
        id: job.companyId?._id,
        name: job.companyId?.name || job.companyName || 'Unknown Company',
        industry: job.companyId?.industry,
        location: job.companyId?.location
      },
      location: job.location,
      workMode: job.workMode || 'Hybrid',
      employmentType: job.employmentType,
      jobType: job.jobType || job.employmentType,
      experience: job.experience || job.experienceLevel,
      salary: job.salary || job.salaryRange,
      status: job.status || 'Active',
      deadline: job.deadline,
      educationRequirements: job.educationRequirements,
      description: job.description
    },
    matchScore: analysis.matchScore,
    matchedSkills: analysis.matchedSkills,
    partialSkills: analysis.partialSkills,
    missingSkills: analysis.missingSkills,
    blockedSkills: analysis.blockedSkills,
    skillGaps: analysis.skillGaps,
    explanation: analysis.explanation,
    hasApplied: !!application,
    application: application || null,
    applicationStatus: application ? application.status : null
  };
};

/**
 * Generate Topological Prerequisite-Ordered Learning Path for a Job
 */
const generateJobLearningPath = async (userId, jobId) => {
  const job = await Job.findById(jobId)
    .populate('companyId')
    .populate('requirements.skillId');

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  // 1. Fetch user skills
  const userSkills = await UserSkill.find({ userId });
  const userSkillMap = {};
  userSkills.forEach(us => {
    if (us.skillId) {
      userSkillMap[us.skillId.toString()] = us.proficiency;
    }
  });

  // 2. Fetch all completed topic progress
  const completedProgress = await UserTopicProgress.find({ userId });
  const completedTopicSet = new Set(
    completedProgress.map(p => `${p.skillId.toString()}_${p.topicTitle}`)
  );

  // 3. Extract required skills that require learning (partial, missing, or blocked)
  const reqSkillsMap = new Map();
  const targetProfMap = new Map();
  const importanceMap = new Map();

  for (const req of (job.requirements || [])) {
    if (req.skillId) {
      const sId = req.skillId._id.toString();
      const expectedProf = req.expectedProficiency || req.requiredProficiency || 3;
      const currentProf = userSkillMap[sId] || 0;
      targetProfMap.set(sId, expectedProf);
      importanceMap.set(sId, req.importance || 'required');

      // Include all skills that aren't fully mastered
      if (currentProf < expectedProf) {
        reqSkillsMap.set(sId, req.skillId);
      }
    }
  }

  // 4. Fetch prerequisite relationships from SkillRelationship
  const allPrereqRels = await SkillRelationship.find({ relationshipType: 'prerequisite' })
    .populate('sourceSkillId')
    .populate('targetSkillId')
    .lean();

  // 5. Expand to include any missing prerequisite skills not explicitly in the job requirements!
  // e.g. If job requires React, but React requires JavaScript, and user has no JavaScript:
  // include JavaScript as a foundational chapter!
  const skillsToLearn = new Map(reqSkillsMap);
  let newlyAdded = true;

  while (newlyAdded) {
    newlyAdded = false;
    for (const rel of allPrereqRels) {
      if (rel.sourceSkillId && rel.targetSkillId) {
        const targetId = rel.targetSkillId._id.toString();
        const sourceId = rel.sourceSkillId._id.toString();

        if (skillsToLearn.has(targetId)) {
          const sourceProf = userSkillMap[sourceId] || 0;
          if (sourceProf < 2 && !skillsToLearn.has(sourceId)) {
            skillsToLearn.set(sourceId, rel.sourceSkillId);
            targetProfMap.set(sourceId, 2);
            importanceMap.set(sourceId, 'required');
            newlyAdded = true;
          }
        }
      }
    }
  }

  // If user already mastered everything, include the job requirements for review
  if (skillsToLearn.size === 0) {
    for (const req of (job.requirements || [])) {
      if (req.skillId) {
        const sId = req.skillId._id.toString();
        skillsToLearn.set(sId, req.skillId);
        targetProfMap.set(sId, req.expectedProficiency || 3);
        importanceMap.set(sId, req.importance || 'required');
      }
    }
  }

  const skillIdsArray = Array.from(skillsToLearn.keys());

  // 6. Build DAG among skillsToLearn and perform Topological Sort (Kahn's Algorithm)
  const inDegree = new Map();
  const adj = new Map();

  skillIdsArray.forEach(id => {
    inDegree.set(id, 0);
    adj.set(id, []);
  });

  allPrereqRels.forEach(rel => {
    if (rel.sourceSkillId && rel.targetSkillId) {
      const src = rel.sourceSkillId._id.toString();
      const tgt = rel.targetSkillId._id.toString();
      if (skillsToLearn.has(src) && skillsToLearn.has(tgt)) {
        adj.get(src).push(tgt);
        inDegree.set(tgt, (inDegree.get(tgt) || 0) + 1);
      }
    }
  });

  // Kahn's algorithm queue
  const queue = [];
  skillIdsArray.forEach(id => {
    if (inDegree.get(id) === 0) {
      queue.push(id);
    }
  });

  // Sort queue by importance weight descending for tie-breaking
  queue.sort((a, b) => {
    return getImportanceWeight(importanceMap.get(b)) - getImportanceWeight(importanceMap.get(a));
  });

  const topologicallySortedSkillIds = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    topologicallySortedSkillIds.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const neighbor of neighbors) {
      const newDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Add any remaining skills if a cycle exists
  skillIdsArray.forEach(id => {
    if (!topologicallySortedSkillIds.includes(id)) {
      topologicallySortedSkillIds.push(id);
    }
  });

  // 7. Assemble Chapters for each skill in topological order
  let totalPathTopics = 0;
  let totalPathCompletedTopics = 0;
  const chapters = [];

  for (let i = 0; i < topologicallySortedSkillIds.length; i++) {
    const sId = topologicallySortedSkillIds[i];
    const skillDoc = skillsToLearn.get(sId);
    if (!skillDoc) continue;

    const skillName = skillDoc.name;
    const currentProf = userSkillMap[sId] || 0;
    const targetProf = targetProfMap.get(sId) || 3;
    const importance = importanceMap.get(sId) || 'required';

    // Prerequisite names
    const directPrereqs = allPrereqRels
      .filter(rel => rel.targetSkillId?._id?.toString() === sId)
      .map(rel => rel.sourceSkillId?.name)
      .filter(Boolean);

    // Fetch topics from database or fallback
    let dbTopics = await Topic.find({ skillId: sId }).sort({ order: 1 }).lean();
    if (!dbTopics || dbTopics.length === 0) {
      const predefined = LEARNING_TOPICS_FALLBACK[skillName] || DEFAULT_FALLBACK_TOPICS;
      dbTopics = predefined.map((t, idx) => ({
        _id: `${sId}_topic_${idx}`,
        title: t.title,
        summary: t.summary || '',
        order: t.order || (idx + 1),
        difficulty: t.difficulty || 'intermediate'
      }));
    }

    // Fetch learning resources for this skill
    const resources = await LearningResource.find({ skillId: sId }).lean();

    let chapterCompletedCount = 0;
    const topicItems = dbTopics.map((topic, tIdx) => {
      const isDone = completedTopicSet.has(`${sId}_${topic.title}`);
      if (isDone) chapterCompletedCount++;

      // Filter resources matching topic title or attach skill resources
      const matchedRes = resources.filter(r =>
        r.topicTitle === topic.title || !r.topicTitle
      ).slice(0, 2);

      return {
        id: topic._id,
        title: topic.title,
        summary: topic.summary || 'Core practical topic.',
        order: topic.order || (tIdx + 1),
        difficulty: topic.difficulty || (tIdx === 0 ? 'beginner' : tIdx === 1 ? 'intermediate' : 'advanced'),
        completed: isDone,
        resources: matchedRes.map(r => ({
          id: r._id,
          title: r.title,
          provider: r.provider || 'SkillGraph Curated',
          type: r.type || 'Course',
          url: r.url,
          difficulty: r.difficulty,
          estimatedHours: r.estimatedHours || 1
        }))
      };
    });

    const chapterTotalTopics = topicItems.length;
    const chapterProgress = chapterTotalTopics > 0
      ? Math.round((chapterCompletedCount / chapterTotalTopics) * 100)
      : 0;

    totalPathTopics += chapterTotalTopics;
    totalPathCompletedTopics += chapterCompletedCount;

    let chapterStatus = 'ready';
    if (chapterProgress === 100) {
      chapterStatus = 'completed';
    } else if (chapterProgress > 0) {
      chapterStatus = 'in_progress';
    } else if (directPrereqs.some(p => {
      // Check if any prerequisite skill in the path is not yet completed
      const prereqSkillId = skillIdsArray.find(id => skillsToLearn.get(id)?.name === p);
      if (prereqSkillId) {
        return (userSkillMap[prereqSkillId] || 0) < 2;
      }
      return false;
    })) {
      chapterStatus = 'blocked';
    }

    chapters.push({
      chapterNumber: i + 1,
      title: `Chapter ${i + 1}: ${skillName} ${currentProf > 0 ? 'Proficiency Upgrade' : 'Foundations'}`,
      skill: {
        id: sId,
        name: skillName,
        category: skillDoc.category || 'General',
        description: skillDoc.description || ''
      },
      status: chapterStatus,
      importance,
      currentProficiency: currentProf,
      targetProficiency: targetProf,
      prerequisites: directPrereqs,
      topicsCount: chapterTotalTopics,
      completedTopicsCount: chapterCompletedCount,
      progress: chapterProgress,
      topics: topicItems
    });
  }

  const overallProgress = totalPathTopics > 0
    ? Math.round((totalPathCompletedTopics / totalPathTopics) * 100)
    : 100;

  return {
    jobId: job._id,
    jobTitle: job.title,
    company: job.companyId?.name || job.companyName || 'Company',
    overallProgress,
    totalChapters: chapters.length,
    completedChapters: chapters.filter(c => c.progress === 100).length,
    totalTopics: totalPathTopics,
    completedTopics: totalPathCompletedTopics,
    chapters
  };
};

/**
 * Manager/Admin Job Management Operations
 */
const createJob = async (jobData, actorUser) => {
  const {
    title,
    companyId,
    companyName,
    description,
    location,
    workMode,
    employmentType,
    jobType,
    experience,
    experienceLevel,
    salary,
    salaryRange,
    salaryMin,
    salaryMax,
    salaryCurrency,
    applicationUrl,
    deadline,
    status,
    educationRequirements,
    requirements
  } = jobData;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    throw new BadRequestError('Job title is required');
  }

  // If companyId is provided, check existence
  if (companyId) {
    const comp = await Company.findById(companyId);
    if (!comp) {
      throw new NotFoundError('Company not found');
    }
  }

  // Validate skill requirements if provided
  const processedRequirements = [];
  if (requirements && Array.isArray(requirements)) {
    const seenSkillIds = new Set();
    for (const req of requirements) {
      if (!req.skillId) {
        throw new BadRequestError('Each requirement must specify a valid skillId');
      }
      const sId = req.skillId.toString();
      if (seenSkillIds.has(sId)) {
        throw new BadRequestError(`Duplicate requirement found for skill ID: ${sId}`);
      }
      seenSkillIds.add(sId);

      const skillDoc = await Skill.findById(sId);
      if (!skillDoc) {
        throw new NotFoundError(`Skill with ID ${sId} not found in catalog`);
      }

      const prof = Number(req.expectedProficiency || req.requiredProficiency || 3);
      if (isNaN(prof) || prof < 1 || prof > 5) {
        throw new BadRequestError('Expected proficiency must be an integer between 1 and 5');
      }

      const rawImp = (req.importance || 'required').toLowerCase().replace(/\s+/g, '_');
      const validImps = ['required', 'important', 'nice_to_have'];
      const importance = validImps.includes(rawImp) ? rawImp : 'required';

      processedRequirements.push({
        skillId: skillDoc._id,
        requiredProficiency: prof,
        expectedProficiency: prof,
        importance,
        required: importance === 'required'
      });
    }
  }

  const job = await Job.create({
    title: title.trim(),
    companyId: companyId || undefined,
    companyName: companyName ? companyName.trim() : '',
    recruiterId: actorUser ? actorUser._id : undefined,
    openings: jobData.openings ? Number(jobData.openings) : 1,
    description: description || '',
    location: location ? location.trim() : 'Remote',
    workMode: workMode || 'Hybrid',
    employmentType: employmentType || 'Full-time',
    jobType: jobType || employmentType || 'Full Time',
    experience: experience || experienceLevel || '0–2 years',
    experienceLevel: experienceLevel || 'Mid',
    salary: salary || salaryRange || '',
    salaryRange: salaryRange || salary || '',
    salaryMin: salaryMin !== undefined ? Number(salaryMin) : null,
    salaryMax: salaryMax !== undefined ? Number(salaryMax) : null,
    salaryCurrency: salaryCurrency || 'INR',
    applicationUrl: applicationUrl ? applicationUrl.trim() : '',
    sourceUrl: applicationUrl ? applicationUrl.trim() : '',
    deadline: deadline ? new Date(deadline) : null,
    status: status || 'Active',
    educationRequirements: educationRequirements || {},
    requirements: processedRequirements,
    postedAt: new Date(),
    source: 'SkillGraph Internal'
  });

  const populated = await Job.findById(job._id)
    .populate('companyId')
    .populate('requirements.skillId');

  return populated;
};

const updateJob = async (jobId, jobData, actorUser) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const isAdmin = actorUser?.accountRole === 'admin';
  const isOwner = job.recruiterId && actorUser && job.recruiterId.toString() === actorUser._id.toString();
  if (!isAdmin && !isOwner && job.recruiterId) {
    throw new ForbiddenError('You can only modify jobs that you created');
  }

  const allowedFields = [
    'title', 'companyId', 'companyName', 'description', 'location',
    'workMode', 'employmentType', 'jobType', 'experience', 'experienceLevel',
    'salary', 'salaryRange', 'salaryMin', 'salaryMax', 'salaryCurrency',
    'applicationUrl', 'sourceUrl', 'deadline', 'status', 'educationRequirements',
    'openings'
  ];

  allowedFields.forEach(field => {
    if (jobData[field] !== undefined) {
      job[field] = jobData[field];
    }
  });

  if (jobData.requirements !== undefined && Array.isArray(jobData.requirements)) {
    const seenSkillIds = new Set();
    const processedRequirements = [];

    for (const req of jobData.requirements) {
      if (!req.skillId) {
        throw new BadRequestError('Each requirement must specify a valid skillId');
      }
      const sId = (req.skillId._id || req.skillId).toString();
      if (seenSkillIds.has(sId)) {
        throw new BadRequestError(`Duplicate requirement found for skill ID: ${sId}`);
      }
      seenSkillIds.add(sId);

      const skillDoc = await Skill.findById(sId);
      if (!skillDoc) {
        throw new NotFoundError(`Skill with ID ${sId} not found in catalog`);
      }

      const prof = Number(req.expectedProficiency || req.requiredProficiency || 3);
      if (isNaN(prof) || prof < 1 || prof > 5) {
        throw new BadRequestError('Expected proficiency must be an integer between 1 and 5');
      }

      const rawImp = (req.importance || 'required').toLowerCase().replace(/\s+/g, '_');
      const validImps = ['required', 'important', 'nice_to_have'];
      const importance = validImps.includes(rawImp) ? rawImp : 'required';

      processedRequirements.push({
        skillId: skillDoc._id,
        requiredProficiency: prof,
        expectedProficiency: prof,
        importance,
        required: importance === 'required'
      });
    }

    job.requirements = processedRequirements;
  }

  await job.save();

  const populated = await Job.findById(job._id)
    .populate('companyId')
    .populate('requirements.skillId');

  return populated;
};

const deleteJob = async (jobId, actorUser) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const isAdmin = actorUser?.accountRole === 'admin';
  const isOwner = job.recruiterId && actorUser && job.recruiterId.toString() === actorUser._id.toString();
  if (!isAdmin && !isOwner && job.recruiterId) {
    throw new ForbiddenError('You can only delete jobs that you created');
  }

  await Job.findByIdAndDelete(jobId);
  return { message: 'Job deleted successfully', jobId };
};

const applyForJob = async (userId, jobId, applicationData = {}) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  // Check if job is closed
  if (job.status && (job.status.toLowerCase() === 'closed')) {
    throw new BadRequestError('This position is closed and is no longer accepting applications.');
  }

  // Check if deadline has passed
  if (job.deadline && new Date() > new Date(job.deadline)) {
    throw new BadRequestError('The application deadline for this position has passed.');
  }

  const { fullName, email, phone, resumeUrl, coverLetter, skills, portfolioUrl, education, notes } = applicationData;

  if (resumeUrl && !isValidUrl(resumeUrl)) {
    throw new BadRequestError('Invalid resumeUrl format. Must be a valid HTTP or HTTPS URL.');
  }

  if (!resumeUrl && process.env.NODE_ENV !== 'test' && config.nodeEnv !== 'test') {
    throw new BadRequestError('Resume link or document is required to apply.');
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    throw new BadRequestError('Please provide a valid email address.');
  }

  // Duplicate application prevention
  const existing = await JobApplication.findOne({ userId, jobId });
  if (existing) {
    throw new ConflictError('You have already applied for this position');
  }

  // Calculate current match score for application snapshot
  let matchScore = 0;
  try {
    const userSkills = await UserSkill.find({ userId });
    const userSkillMap = {};
    userSkills.forEach(us => {
      if (us.skillId) userSkillMap[us.skillId.toString()] = us.proficiency;
    });
    const matchAnalysis = calculateJobMatch(job, userSkillMap);
    matchScore = matchAnalysis.matchScore || 0;
  } catch (_) {
    matchScore = 0;
  }

  const application = await JobApplication.create({
    userId,
    studentId: userId,
    jobId,
    recruiterId: job.recruiterId || undefined,
    fullName: fullName ? fullName.trim() : '',
    email: email ? email.trim() : '',
    phone: phone ? phone.trim() : '',
    education: education ? education.trim() : '',
    portfolioUrl: portfolioUrl ? portfolioUrl.trim() : '',
    skills: Array.isArray(skills) ? skills : [],
    resumeUrl: resumeUrl ? resumeUrl.trim() : '',
    coverLetter: coverLetter ? coverLetter.trim() : '',
    notes: notes ? notes.trim() : '',
    matchScore,
    status: 'applied',
    appliedAt: new Date()
  });

  try {
    const notificationService = require('./notificationService');
    const compName = job.companyName || (job.companyId ? job.companyId.name : 'the hiring company');
    
    // 1. Notification for Student
    notificationService.createNotification({
      userId,
      type: 'application_submitted',
      title: 'Application Submitted',
      message: `Application submitted for ${job.title} at ${compName}.`,
      link: '/applications',
      metadata: { jobId: job._id, applicationId: application._id }
    }).catch(e => console.error('Error creating app notification:', e));

    // 2. Notification for Recruiter (if assigned)
    if (job.recruiterId) {
      notificationService.createNotification({
        userId: job.recruiterId,
        type: 'new_applicant',
        title: 'New Applicant Received',
        message: `${fullName || 'A student'} submitted an application for ${job.title}.`,
        link: '/admin/applicants',
        metadata: { jobId: job._id, applicationId: application._id }
      }).catch(e => console.error('Error creating recruiter notification:', e));
    }
  } catch (err) {}

  return application;
};

const getUserApplications = async (userId) => {
  const applications = await JobApplication.find({ userId })
    .populate({
      path: 'jobId',
      populate: { path: 'companyId' }
    })
    .sort({ appliedAt: -1 });

  return applications;
};

const getAllApplications = async (filters = {}, actorUser) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.jobId) query.jobId = filters.jobId;

  if (actorUser && actorUser.accountRole !== 'admin') {
    const recruiterJobs = await Job.find({ recruiterId: actorUser._id }, '_id');
    const jobIds = recruiterJobs.map(j => j._id);
    query.$or = [
      { recruiterId: actorUser._id },
      { jobId: { $in: jobIds } }
    ];
  }

  const applications = await JobApplication.find(query)
    .populate({
      path: 'jobId',
      populate: { path: 'companyId' }
    })
    .populate('userId', 'name email branch college')
    .sort({ appliedAt: -1 });

  return applications;
};

const getApplicationById = async (applicationId, user) => {
  const application = await JobApplication.findById(applicationId)
    .populate({
      path: 'jobId',
      populate: { path: 'companyId' }
    })
    .populate('userId', 'name email branch college');

  if (!application) {
    throw new NotFoundError('Job application not found');
  }

  const isAdmin = user.accountRole === 'admin';
  const isRecruiter = user.accountRole === 'recruiter' || user.accountRole === 'manager';
  const isOwner = application.userId._id.toString() === user._id.toString();

  if (isRecruiter && !isAdmin) {
    const job = await Job.findById(application.jobId);
    const ownsJob = job && job.recruiterId && job.recruiterId.toString() === user._id.toString();
    const isDirectRecruiter = application.recruiterId && application.recruiterId.toString() === user._id.toString();
    if (!ownsJob && !isDirectRecruiter) {
      throw new ForbiddenError('You are not authorized to view this application');
    }
  } else if (!isAdmin && !isOwner) {
    throw new ForbiddenError('You are not authorized to view this application');
  }

  return application;
};

const updateApplicationStatus = async (applicationId, user, newStatus) => {
  const application = await JobApplication.findById(applicationId);
  if (!application) {
    throw new NotFoundError('Job application not found');
  }

  const allowedStatuses = [
    'applied', 'Applied',
    'under_review', 'Under Review', 'screening', 'reviewing',
    'shortlisted', 'Shortlisted',
    'interview', 'Interview', 'interviewing',
    'offered', 'Offered', 'selected', 'Selected',
    'rejected', 'Rejected',
    'withdrawn', 'Withdrawn'
  ];
  if (!allowedStatuses.includes(newStatus)) {
    throw new BadRequestError(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
  }

  const isAdmin = user.accountRole === 'admin';
  const isRecruiter = user.accountRole === 'recruiter' || user.accountRole === 'manager';
  const isStudent = user.accountRole === 'student' || user.accountRole === 'employee';
  const isOwner = application.userId.toString() === user._id.toString();

  if (isStudent) {
    if (!isOwner) throw new ForbiddenError('You are not authorized to update this application');
    if (newStatus.toLowerCase() !== 'withdrawn') {
      throw new ForbiddenError('Students can only withdraw their own application');
    }
  }

  if (isRecruiter && !isAdmin) {
    const job = await Job.findById(application.jobId);
    const ownsJob = job && job.recruiterId && job.recruiterId.toString() === user._id.toString();
    const isDirectRecruiter = application.recruiterId && application.recruiterId.toString() === user._id.toString();
    if (!ownsJob && !isDirectRecruiter && job && job.recruiterId) {
      throw new ForbiddenError('You can only update applications for your own jobs');
    }
  }

  const oldStatus = application.status;
  if (oldStatus && oldStatus.toLowerCase() === newStatus.toLowerCase()) {
    return application;
  }
  application.status = newStatus;
  await application.save();

  if (isAdmin || isRecruiter) {
    const auditService = require('./auditService');
    await auditService.logAction({
      actorId: user._id,
      action: 'JOB_APPLICATION_STATUS_UPDATE',
      targetEntity: 'JobApplication',
      targetId: application._id,
      changes: { oldStatus, newStatus }
    });
  }

  // Trigger student notifications on recruiter/admin status update
  try {
    const studentUser = await User.findById(application.userId);
    const job = await Job.findById(application.jobId);
    if (studentUser && job) {
      const notificationService = require('./notificationService');
      await notificationService.sendCandidateStatusUpdate({
        studentId: studentUser._id,
        studentEmail: studentUser.email,
        studentName: studentUser.name,
        jobTitle: job.title,
        companyName: job.companyName || (job.companyId ? job.companyId.name : 'SkillGraph Partner'),
        status: newStatus,
        jobId: job._id
      });
    }
  } catch (notifyErr) {
    console.error('Failed to dispatch status update notification:', notifyErr.message);
  }

  return application;
};

const getMarketAnalytics = async () => {
  const totalOpenings = await Job.countDocuments();
  const activeOpenings = await Job.countDocuments({ status: { $in: ['Active', 'active'] } });
  const totalApplications = await JobApplication.countDocuments();

  const topSkills = await Job.aggregate([
    { $unwind: '$requirements' },
    {
      $group: {
        _id: '$requirements.skillId',
        count: { $sum: 1 },
        avgRequiredProficiency: { $avg: '$requirements.requiredProficiency' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'skills',
        localField: '_id',
        foreignField: '_id',
        as: 'skill'
      }
    },
    { $unwind: '$skill' },
    {
      $project: {
        skillId: '$_id',
        name: '$skill.name',
        category: '$skill.category',
        count: 1,
        avgRequiredProficiency: { $round: ['$avgRequiredProficiency', 1] }
      }
    }
  ]);

  const salaryStats = await Job.aggregate([
    { $match: { salaryMin: { $ne: null }, salaryMax: { $ne: null } } },
    { $project: { avgJobSalary: { $avg: ['$salaryMin', '$salaryMax'] } } },
    { $group: { _id: null, avgSalary: { $avg: '$avgJobSalary' } } }
  ]);
  const avgSalary = salaryStats[0] ? Math.round(salaryStats[0].avgSalary) : 0;

  const remoteJobsCount = await Job.countDocuments({
    $or: [
      { location: { $regex: /remote/i } },
      { workMode: { $regex: /remote/i } }
    ]
  });
  const remotePercentage = totalOpenings > 0 ? Math.round((remoteJobsCount / totalOpenings) * 100) : 0;

  return {
    totalOpenings,
    totalJobs: totalOpenings,
    activeOpenings,
    activeJobs: activeOpenings,
    totalApplications,
    topSkills,
    topRequiredSkills: topSkills,
    avgSalary,
    remotePercentage
  };
};

module.exports = {
  getJobs,
  getJobById,
  getJobMatches,
  calculateJobMatch,
  getJobMatchForUser,
  generateJobLearningPath,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getUserApplications,
  getAllApplications,
  getApplicationById,
  updateApplicationStatus,
  getMarketAnalytics
};
