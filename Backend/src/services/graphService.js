const neo4j = require('neo4j-driver');
const { getSession } = require('../config/cognodb');
const { calculateReadiness } = require('../utils/scoring');
const RoleSkill = require('../models/RoleSkill');
const UserTopicProgress = require('../models/UserTopicProgress');
const LearningProgress = require('../models/LearningProgress');
const LearningResource = require('../models/LearningResource');
const Job = require('../models/Job');
const Company = require('../models/Company');
const SkillRelationship = require('../models/SkillRelationship');

const convertIntegers = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (neo4j.isInt(obj)) return obj.toNumber();
  if (Array.isArray(obj)) return obj.map(convertIntegers);
  if (typeof obj === 'object') {
    const res = {};
    for (const key of Object.keys(obj)) {
      res[key] = convertIntegers(obj[key]);
    }
    return res;
  }
  return obj;
};

const runQuery = async (cypher, params = {}) => {
  const session = getSession();
  try {
    const result = await session.run(cypher, params);
    const records = result.records.map(record => record.toObject());
    return convertIntegers(records);
  } finally {
    await session.close();
  }
};

const getUserSkills = async (userId) => {
  const UserSkill = require('../models/UserSkill');
  const mongoUserSkills = await UserSkill.find({ userId }).populate('skillId');

  const cypher = `
    MATCH (u:User { id: $userId })-[h:HAS_SKILL]->(s:Skill)
    RETURN s.id AS skillId, s.name AS name, s.category AS category,
           h.proficiency AS proficiency, h.yearsOfExperience AS yearsOfExperience
  `;
  let records = await runQuery(cypher, { userId });

  if (mongoUserSkills.length !== records.length) {
    await runQuery('MATCH (u:User { id: $userId })-[r:HAS_SKILL]->() DELETE r', { userId });
    await runQuery('MERGE (u:User { id: $userId })', { userId });

    const batch = mongoUserSkills.filter(us => us.skillId).map(us => ({
      skillId: us.skillId._id.toString(),
      name: us.skillId.name,
      category: us.skillId.category,
      proficiency: us.proficiency,
      yearsOfExperience: us.yearsOfExperience || 0
    }));

    if (batch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (s:Skill { id: item.skillId })
         SET s.name = item.name, s.category = item.category`,
        { batch }
      );
      await runQuery(
        `UNWIND $batch AS item
         MATCH (u:User { id: $userId }), (s:Skill { id: item.skillId })
         MERGE (u)-[r:HAS_SKILL]->(s)
         SET r.proficiency = item.proficiency, r.yearsOfExperience = item.yearsOfExperience`,
        { userId, batch }
      );
    }
    records = await runQuery(cypher, { userId });
  }

  return records.map(r => ({
    _id: `${userId}_${r.skillId}`,
    userId,
    skillId: {
      _id: r.skillId,
      name: r.name,
      category: r.category
    },
    proficiency: r.proficiency,
    yearsOfExperience: r.yearsOfExperience
  }));
};

const getCareerRequirements = async (careerId) => {
  const mongoRoleSkills = await RoleSkill.find({ roleId: careerId }).populate('skillId');
  
  const cypher = `
    MATCH (c:Career { id: $careerId })-[r:REQUIRES]->(s:Skill)
    RETURN s.id AS skillId, s.name AS name, s.category AS category,
           r.requiredProficiency AS requiredProficiency, r.importance AS importance
  `;
  let records = await runQuery(cypher, { careerId });

  if (mongoRoleSkills.length !== records.length) {
    await runQuery('MATCH (c:Career { id: $careerId })-[r:REQUIRES]->() DELETE r', { careerId });
    await runQuery('MERGE (c:Career { id: $careerId })', { careerId });
    
    const batch = mongoRoleSkills.filter(rs => rs.skillId).map(rs => ({
      skillId: rs.skillId._id.toString(),
      name: rs.skillId.name,
      category: rs.skillId.category,
      requiredProficiency: rs.requiredProficiency,
      importance: rs.importance
    }));
    
    if (batch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (s:Skill { id: item.skillId })
         SET s.name = item.name, s.category = item.category`,
        { batch }
      );
      await runQuery(
        `UNWIND $batch AS item
         MATCH (c:Career { id: $careerId }), (s:Skill { id: item.skillId })
         MERGE (c)-[r:REQUIRES]->(s)
         SET r.requiredProficiency = item.requiredProficiency, r.importance = item.importance`,
        { careerId, batch }
      );
    }
    records = await runQuery(cypher, { careerId });
  }

  return records.map(r => ({
    _id: `${careerId}_${r.skillId}`,
    roleId: careerId,
    skillId: {
      _id: r.skillId,
      name: r.name,
      category: r.category
    },
    requiredProficiency: r.requiredProficiency,
    importance: r.importance
  }));
};

const getSkillGaps = async (userId, careerId) => {
  const requirements = await getCareerRequirements(careerId);
  const userSkills = await getUserSkills(userId);

  const userSkillMap = {};
  userSkills.forEach(us => {
    userSkillMap[us.skillId._id] = us.proficiency;
  });

  const topicProgressRecords = await getTopicProgress(userId);
  const topicCompletionMap = {};
  topicProgressRecords.forEach(tpr => {
    topicCompletionMap[tpr.skillId] = (topicCompletionMap[tpr.skillId] || 0) + 1;
  });

  const scoringResult = calculateReadiness(requirements, userSkillMap, topicCompletionMap);

  const User = require('../models/User');
  const Role = require('../models/Role');
  const userObj = await User.findById(userId);
  const roleObj = await Role.findById(careerId);

  return {
    user: {
      id: userId,
      name: userObj ? userObj.name : 'Unknown User',
      email: userObj ? userObj.email : ''
    },
    role: {
      id: careerId,
      name: roleObj ? roleObj.name : 'Unknown Role',
      department: roleObj ? roleObj.department : ''
    },
    readinessScore: scoringResult.readinessScore,
    matchedSkills: scoringResult.matchedSkills,
    missingSkills: scoringResult.missingSkills,
    skillsToImprove: scoringResult.skillsToImprove,
    skills: scoringResult.skills
  };
};

const getSkillGraph = async () => {
  const skillRecords = await runQuery(
    `MATCH (s:Skill)
     RETURN s.id AS id, s.name AS name, s.category AS category, s.description AS description`
  );
  
  const topicRecords = await runQuery(
    `MATCH (t:LearningTopic)
     RETURN t.title AS id, t.title AS name, 'LearningTopic' AS category, '' AS description`
  );

  const relationshipRecords = await runQuery(
    `MATCH (s1:Skill)-[r:PREREQUISITE_OF|RELATED_TO|SPECIALIZATION_OF|HAS_TOPIC]->(s2)
     RETURN id(r) AS id, s1.id AS source, COALESCE(s2.id, s2.title) AS target, type(r) AS type, COALESCE(r.strength, 1.0) AS strength`
  );

  const nodes = [
    ...skillRecords.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description
    })),
    ...topicRecords.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description
    }))
  ];

  const edges = relationshipRecords.map(r => {
    let relationshipType = 'prerequisite';
    if (r.type === 'RELATED_TO') relationshipType = 'related';
    else if (r.type === 'SPECIALIZATION_OF') relationshipType = 'specialization';
    else if (r.type === 'HAS_TOPIC') relationshipType = 'has_topic';

    return {
      id: r.id.toString(),
      source: r.source,
      target: r.target,
      relationshipType,
      strength: r.strength
    };
  });

  return { nodes, edges };
};

const getLearningProgress = async (userId) => {
  const mongoProgress = await LearningProgress.find({ userId })
    .populate({
      path: 'resourceId',
      populate: {
        path: 'skillId'
      }
    });

  const cypher = `
    MATCH (u:User { id: $userId })-[e:ENROLLED_IN]->(r:LearningResource)-[:TEACHES]->(s:Skill)
    RETURN r.id AS resourceId, r.title AS title, r.provider AS provider, r.type AS type, r.url AS url,
           r.difficulty AS difficulty, r.estimatedHours AS estimatedHours,
           s.id AS skillId, s.name AS skillName, s.category AS skillCategory,
           e.status AS status, e.progressPercentage AS progressPercentage, e.startedAt AS startedAt, e.completedAt AS completedAt
  `;
  let records = await runQuery(cypher, { userId });

  if (mongoProgress.length !== records.length) {
    await runQuery('MATCH (u:User { id: $userId })-[e:ENROLLED_IN]->() DELETE e', { userId });
    await runQuery('MERGE (u:User { id: $userId })', { userId });

    for (const lp of mongoProgress) {
      if (lp.resourceId) {
        const resId = lp.resourceId._id.toString();
        await runQuery(
          `MERGE (r:LearningResource { id: $resId })
           SET r.title = $title, r.provider = $provider, r.type = $type, r.url = $url,
               r.difficulty = $difficulty, r.estimatedHours = $estimatedHours`,
          {
            resId,
            title: lp.resourceId.title,
            provider: lp.resourceId.provider || '',
            type: lp.resourceId.type || '',
            url: lp.resourceId.url || '',
            difficulty: lp.resourceId.difficulty || '',
            estimatedHours: lp.resourceId.estimatedHours || 0
          }
        );
        if (lp.resourceId.skillId) {
          const skillId = lp.resourceId.skillId._id.toString();
          await runQuery('MERGE (s:Skill { id: $skillId })', { skillId });
          await runQuery(
            `MATCH (r:LearningResource { id: $resId }), (s:Skill { id: $skillId })
             MERGE (r)-[:TEACHES]->(s)`,
            { resId, skillId }
          );
        }
        await runQuery(
          `MATCH (u:User { id: $userId }), (r:LearningResource { id: $resId })
           MERGE (u)-[e:ENROLLED_IN]->(r)
           SET e.status = $status, e.progressPercentage = $progressPercentage,
               e.startedAt = $startedAt, e.completedAt = $completedAt`,
          {
            userId,
            resId,
            status: lp.status,
            progressPercentage: lp.progressPercentage,
            startedAt: lp.startedAt ? lp.startedAt.toISOString() : '',
            completedAt: lp.completedAt ? lp.completedAt.toISOString() : ''
          }
        );
      }
    }
    records = await runQuery(cypher, { userId });
  }

  return records.map(p => ({
    _id: `${userId}_${p.resourceId}`,
    userId,
    resourceId: {
      _id: p.resourceId,
      title: p.title,
      provider: p.provider,
      type: p.type,
      url: p.url,
      difficulty: p.difficulty,
      estimatedHours: p.estimatedHours,
      skillId: {
        _id: p.skillId,
        name: p.skillName,
        category: p.skillCategory
      }
    },
    status: p.status,
    progressPercentage: p.progressPercentage,
    startedAt: p.startedAt ? new Date(p.startedAt) : null,
    completedAt: p.completedAt ? new Date(p.completedAt) : null
  }));
};

const getJobMatches = async (userId) => {
  const mongoCompanies = await Company.find();
  const mongoJobs = await Job.find().populate('requirements.skillId');

  const dbJobCount = (await runQuery('MATCH (j:Job) RETURN count(j) AS count'))[0]?.count || 0;
  const dbCompanyCount = (await runQuery('MATCH (c:Company) RETURN count(c) AS count'))[0]?.count || 0;

  if (mongoJobs.length !== dbJobCount || mongoCompanies.length !== dbCompanyCount) {
    await runQuery('MATCH (j:Job) DETACH DELETE j');
    await runQuery('MATCH (c:Company) DETACH DELETE c');

    const companyBatch = mongoCompanies.map(c => ({
      id: c._id.toString(),
      name: c.name,
      description: c.description || '',
      industry: c.industry || '',
      website: c.website || '',
      location: c.location || ''
    }));

    if (companyBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (c:Company { id: item.id })
         SET c.name = item.name, c.description = item.description, c.industry = item.industry, c.website = item.website, c.location = item.location`,
        { batch: companyBatch }
      );
    }

    const jobBatch = mongoJobs.map(j => ({
      id: j._id.toString(),
      title: j.title,
      description: j.description || '',
      location: j.location || '',
      employmentType: j.employmentType || '',
      experienceLevel: j.experienceLevel || '',
      salaryRange: j.salaryRange || '',
      source: j.source || '',
      sourceUrl: j.sourceUrl || ''
    }));

    if (jobBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (j:Job { id: item.id })
         SET j.title = item.title, j.description = item.description, j.location = item.location,
             j.employmentType = item.employmentType, j.experienceLevel = item.experienceLevel,
             j.salaryRange = item.salaryRange, j.source = item.source, j.sourceUrl = item.sourceUrl`,
        { batch: jobBatch }
      );
    }

    const jobCompanyBatch = mongoJobs.filter(j => j.companyId).map(j => ({
      companyId: j.companyId.toString(),
      jobId: j._id.toString()
    }));

    if (jobCompanyBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MATCH (c:Company { id: item.companyId }), (j:Job { id: item.jobId })
         MERGE (c)-[:POSTS]->(j)`,
        { batch: jobCompanyBatch }
      );
    }

    const jobSkillBatch = [];
    for (const job of mongoJobs) {
      for (const req of job.requirements) {
        if (req.skillId) {
          jobSkillBatch.push({
            jobId: job._id.toString(),
            skillId: req.skillId._id ? req.skillId._id.toString() : req.skillId.toString(),
            name: req.skillId.name || '',
            category: req.skillId.category || '',
            requiredProficiency: req.requiredProficiency,
            importance: req.importance
          });
        }
      }
    }

    if (jobSkillBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (s:Skill { id: item.skillId })
         SET s.name = item.name, s.category = item.category`,
        { batch: jobSkillBatch }
      );
      await runQuery(
        `UNWIND $batch AS item
         MATCH (j:Job { id: item.jobId }), (s:Skill { id: item.skillId })
         MERGE (j)-[r:REQUIRES]->(s)
         SET r.requiredProficiency = item.requiredProficiency, r.importance = item.importance`,
        { batch: jobSkillBatch }
      );
    }
  }

  const userSkills = await getUserSkills(userId);
  const userSkillMap = {};
  userSkills.forEach(us => {
    userSkillMap[us.skillId._id] = us.proficiency;
  });

  const topicProgressRecords = await getTopicProgress(userId);
  const topicCompletionMap = {};
  topicProgressRecords.forEach(tpr => {
    topicCompletionMap[tpr.skillId] = (topicCompletionMap[tpr.skillId] || 0) + 1;
  });

  const jobRecords = await runQuery(
    `MATCH (j:Job)
     OPTIONAL MATCH (c:Company)-[:POSTS]->(j)
     OPTIONAL MATCH (j)-[r:REQUIRES]->(s:Skill)
     RETURN j.id AS jobId, j.title AS title, j.description AS description, j.location AS location,
            j.employmentType AS employmentType, j.experienceLevel AS experienceLevel, j.salaryRange AS salaryRange,
            j.source AS source, j.sourceUrl AS sourceUrl,
            c.id AS companyId, c.name AS companyName, c.description AS companyDescription,
            c.industry AS companyIndustry, c.website AS companyWebsite, c.location AS companyLocation,
            collect(CASE WHEN s IS NOT NULL THEN {
              skillId: s.id,
              name: s.name,
              category: s.category,
              requiredProficiency: r.requiredProficiency,
              importance: r.importance
            } END) AS requirements`
  );

  const generateJobMatchExplanation = (title, matchScore, matchedCount, missingCount, improveCount) => {
    if (matchScore >= 80) {
      return `Excellent match (Score: ${matchScore}%). You satisfy almost all core required proficiencies for the ${title} position. You have ${matchedCount} mastered requirements and only need minor adjustments.`;
    } else if (matchScore >= 50) {
      return `Good match (Score: ${matchScore}%). You meet several requirements for ${title}, but there are ${missingCount} missing skill(s) and ${improveCount} skill(s) that require proficiency upgrades.`;
    } else {
      return `Gap warning (Score: ${matchScore}%). There is a significant divergence between your current profile and the required skill levels. You are missing ${missingCount} key skill(s). We recommend completing the prerequisite learning paths first.`;
    }
  };

  const matches = jobRecords.map(j => {
    const mappedRequirements = (j.requirements || []).filter(req => req !== null).map(req => ({
      skillId: {
        _id: req.skillId,
        name: req.name,
        category: req.category
      },
      requiredProficiency: req.requiredProficiency,
      importance: req.importance
    }));

    const analysis = calculateReadiness(mappedRequirements, userSkillMap, topicCompletionMap);

    return {
      jobId: j.jobId,
      title: j.title,
      company: j.companyId ? {
        id: j.companyId,
        name: j.companyName || 'Unknown Company',
        description: j.companyDescription,
        industry: j.companyIndustry,
        website: j.companyWebsite,
        location: j.companyLocation
      } : {
        id: null,
        name: 'Unknown Company'
      },
      description: j.description,
      location: j.location,
      employmentType: j.employmentType,
      experienceLevel: j.experienceLevel,
      salaryRange: j.salaryRange,
      matchScore: analysis.readinessScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      skillsToImprove: analysis.skillsToImprove,
      skills: analysis.skills,
      explanation: generateJobMatchExplanation(
        j.title,
        analysis.readinessScore,
        analysis.matchedSkills,
        analysis.missingSkills,
        analysis.skillsToImprove
      ),
      source: j.source,
      sourceUrl: j.sourceUrl
    };
  });

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
};

const getRecommendations = async (userId, careerId) => {
  const Skill = require('../models/Skill');
  const mongoSkills = await Skill.find();
  const dbSkillCount = (await runQuery('MATCH (s:Skill) RETURN count(s) AS count'))[0]?.count || 0;
  if (mongoSkills.length !== dbSkillCount) {
    const skillBatch = mongoSkills.map(s => ({
      id: s._id.toString(),
      name: s.name,
      category: s.category || '',
      description: s.description || ''
    }));
    if (skillBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (s:Skill { id: item.id })
         SET s.name = item.name, s.category = item.category, s.description = item.description`,
        { batch: skillBatch }
      );
    }
  }

  const mongoRelationships = await SkillRelationship.find();
  const mongoResources = await LearningResource.find().populate('skillId');

  const dbPrereqCount = (await runQuery('MATCH ()-[r:PREREQUISITE_OF]->() RETURN count(r) AS count'))[0]?.count || 0;
  const dbRelatedCount = (await runQuery('MATCH ()-[r:RELATED_TO]->() RETURN count(r) AS count'))[0]?.count || 0;
  const dbResourceCount = (await runQuery('MATCH (lr:LearningResource) RETURN count(lr) AS count'))[0]?.count || 0;

  if (
    mongoRelationships.filter(r => r.relationshipType === 'prerequisite').length !== dbPrereqCount ||
    mongoRelationships.filter(r => r.relationshipType === 'related').length !== dbRelatedCount ||
    mongoResources.length !== dbResourceCount
  ) {
    await runQuery('MATCH ()-[r:PREREQUISITE_OF]->() DELETE r');
    await runQuery('MATCH ()-[r:RELATED_TO]->() DELETE r');
    await runQuery('MATCH (lr:LearningResource) DETACH DELETE lr');

    const prereqBatch = [];
    const relatedBatch = [];
    for (const rel of mongoRelationships) {
      if (rel.sourceSkillId && rel.targetSkillId) {
        const item = {
          sourceId: rel.sourceSkillId._id ? rel.sourceSkillId._id.toString() : rel.sourceSkillId.toString(),
          targetId: rel.targetSkillId._id ? rel.targetSkillId._id.toString() : rel.targetSkillId.toString(),
          strength: rel.strength || 1.0
        };
        if (rel.relationshipType === 'prerequisite') {
          prereqBatch.push(item);
        } else {
          relatedBatch.push(item);
        }
      }
    }

    if (prereqBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MATCH (s1:Skill { id: item.sourceId }), (s2:Skill { id: item.targetId })
         MERGE (s1)-[r:PREREQUISITE_OF]->(s2)
         SET r.strength = item.strength`,
        { batch: prereqBatch }
      );
    }

    if (relatedBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MATCH (s1:Skill { id: item.sourceId }), (s2:Skill { id: item.targetId })
         MERGE (s1)-[r:RELATED_TO]->(s2)
         SET r.strength = item.strength`,
        { batch: relatedBatch }
      );
    }

    const resourceBatch = [];
    const teachesBatch = [];
    for (const lr of mongoResources) {
      resourceBatch.push({
        id: lr._id.toString(),
        title: lr.title,
        provider: lr.provider || '',
        type: lr.type || '',
        url: lr.url || '',
        difficulty: lr.difficulty || '',
        estimatedHours: lr.estimatedHours || 0
      });
      if (lr.skillId) {
        teachesBatch.push({
          resourceId: lr._id.toString(),
          skillId: lr.skillId._id ? lr.skillId._id.toString() : lr.skillId.toString()
        });
      }
    }

    if (resourceBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (lr:LearningResource { id: item.id })
         SET lr.title = item.title, lr.provider = item.provider, lr.type = item.type, lr.url = item.url,
             lr.difficulty = item.difficulty, lr.estimatedHours = item.estimatedHours`,
        { batch: resourceBatch }
      );
    }

    if (teachesBatch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MATCH (lr:LearningResource { id: item.resourceId }), (s:Skill { id: item.skillId })
         MERGE (lr)-[:TEACHES]->(s)`,
        { batch: teachesBatch }
      );
    }
  }

  const requirements = await getCareerRequirements(careerId);
  const userSkills = await getUserSkills(userId);
  const userSkillMap = {};
  userSkills.forEach(us => {
    userSkillMap[us.skillId._id] = us.proficiency;
  });

  const roleSkillMap = {};
  requirements.forEach(req => {
    roleSkillMap[req.skillId._id] = {
      requiredProficiency: req.requiredProficiency,
      importance: req.importance
    };
  });

  const topicCompletions = await runQuery(
    `MATCH (u:User { id: $userId })-[:COMPLETED]->(t:LearningTopic)
     RETURN t.skillId AS skillId, COUNT(t) AS completedCount`,
    { userId }
  );
  
  const topicCompletionMap = {};
  topicCompletions.forEach(tc => {
    topicCompletionMap[tc.skillId] = tc.completedCount;
  });

  const SKILL_TOTAL_TOPICS = {
    'HTML': 7,
    'CSS': 7,
    'JavaScript': 10,
    'React': 8,
    'Git': 4,
    'Node.js': 7,
    'Express': 6,
    'MongoDB': 6
  };

  const gapSkills = [];
  requirements.forEach(rs => {
    const skill = rs.skillId;
    const skillIdStr = skill._id;
    const currentProf = userSkillMap[skillIdStr] || 0;

    const totalTopics = SKILL_TOTAL_TOPICS[skill.name] || 3;
    const completedTopicsCount = topicCompletionMap[skillIdStr] || 0;
    const completionRate = totalTopics > 0 ? Math.min(1.0, completedTopicsCount / totalTopics) : 1.0;

    const effectiveProf = currentProf * completionRate;
    const reqProf = rs.requiredProficiency;

    if (effectiveProf < reqProf) {
      gapSkills.push({
        skill,
        currentProficiency: currentProf,
        effectiveProficiency: effectiveProf,
        requiredProficiency: reqProf,
        gap: reqProf - effectiveProf,
        importance: rs.importance
      });
    }
  });

  if (gapSkills.length === 0) return [];

  const prereqRecords = await runQuery(
    `MATCH (s1:Skill)-[:PREREQUISITE_OF]->(s2:Skill)
     WHERE s2.id IN $gapSkillIds
     RETURN s1.id AS sourceId, s1.name AS sourceName, s2.id AS targetId`,
    { gapSkillIds: gapSkills.map(gs => gs.skill._id) }
  );

  const prereqMap = {};
  prereqRecords.forEach(rel => {
    if (!prereqMap[rel.targetId]) prereqMap[rel.targetId] = [];
    prereqMap[rel.targetId].push({ id: rel.sourceId, name: rel.sourceName });
  });

  const unlockRecords = await runQuery(
    `MATCH (s1:Skill)-[:PREREQUISITE_OF]->(s2:Skill)
     WHERE s1.id IN $gapSkillIds AND s2.id IN $gapSkillIds
     RETURN s1.id AS sourceId, s2.id AS targetId`,
    { gapSkillIds: gapSkills.map(gs => gs.skill._id) }
  );
  
  const unlocksMap = {};
  unlockRecords.forEach(rel => {
    if (!unlocksMap[rel.sourceId]) unlocksMap[rel.sourceId] = [];
    unlocksMap[rel.sourceId].push(rel.targetId);
  });

  const resourceRecords = await runQuery(
    `MATCH (r:LearningResource)-[:TEACHES]->(s:Skill)
     WHERE s.id IN $gapSkillIds
     RETURN s.id AS skillId, r.id AS id, r.title AS title, r.url AS url, r.difficulty AS difficulty, r.estimatedHours AS estimatedHours`,
    { gapSkillIds: gapSkills.map(gs => gs.skill._id) }
  );

  const resourceMap = {};
  resourceRecords.forEach(r => {
    if (!resourceMap[r.skillId]) resourceMap[r.skillId] = [];
    resourceMap[r.skillId].push({
      id: r.id,
      title: r.title,
      url: r.url,
      difficulty: r.difficulty,
      estimatedHours: r.estimatedHours
    });
  });

  const recommendations = [];

  for (const gs of gapSkills) {
    const skillIdStr = gs.skill._id;
    const skillPrereqs = prereqMap[skillIdStr] || [];

    const unsatisfiedPrereqs = [];
    for (const prereq of skillPrereqs) {
      const currentProf = userSkillMap[prereq.id] || 0;
      let requiredLevelForPrereq = 2;
      if (roleSkillMap[prereq.id]) {
        requiredLevelForPrereq = roleSkillMap[prereq.id].requiredProficiency;
      }

      if (currentProf < requiredLevelForPrereq) {
        unsatisfiedPrereqs.push({
          id: prereq.id,
          name: prereq.name,
          currentProficiency: currentProf,
          requiredLevel: requiredLevelForPrereq
        });
      }
    }

    const allPrereqsSatisfied = unsatisfiedPrereqs.length === 0;

    let score = 0;
    if (gs.importance === 'required') score += 50;
    else if (gs.importance === 'important') score += 30;
    else if (gs.importance === 'nice_to_have') score += 10;

    score += gs.gap * 8;

    if (allPrereqsSatisfied) score += 15;
    else score -= 30;

    const unlocksOthers = unlocksMap[skillIdStr] && unlocksMap[skillIdStr].length > 0;
    if (unlocksOthers) score += 15;

    const priority = Math.max(0, Math.min(100, score));

    let reason = '';
    if (!allPrereqsSatisfied) {
      const names = unsatisfiedPrereqs.map(p => p.name).join(', ');
      reason = `This skill is required, but you should first learn its prerequisite skill(s): ${names}.`;
    } else {
      if (gs.importance === 'required') {
        reason = `Critical required skill for the role with a gap of ${gs.gap}. Prerequisites are fully satisfied.`;
      } else if (gs.importance === 'important') {
        reason = `Important skill for the role with a gap of ${gs.gap}. Prerequisites are satisfied.`;
      } else {
        reason = `Nice-to-have skill for the role with a gap of ${gs.gap}.`;
      }

      if (unlocksOthers) {
        reason += ' Learning this skill will also help unlock advanced required skills.';
      }
    }

    recommendations.push({
      skill: {
        id: gs.skill._id,
        name: gs.skill.name,
        category: gs.skill.category
      },
      priority,
      reason,
      currentProficiency: gs.currentProficiency,
      targetProficiency: gs.requiredProficiency,
      prerequisiteSkills: skillPrereqs.map(p => ({ id: p.id, name: p.name })),
      unsatisfiedPrerequisites: unsatisfiedPrereqs.map(p => ({ id: p.id, name: p.name })),
      learningResources: resourceMap[skillIdStr] || []
    });
  }

  recommendations.sort((a, b) => b.priority - a.priority);
  return recommendations;
};

const addUserSkill = async (userId, skillId, proficiency, yearsOfExperience) => {
  await runQuery(`MERGE (u:User { id: $userId })`, { userId });
  await runQuery(`MERGE (s:Skill { id: $skillId })`, { skillId });

  const query = `
    MATCH (u:User { id: $userId }), (s:Skill { id: $skillId })
    MERGE (u)-[r:HAS_SKILL]->(s)
    SET r.proficiency = $proficiency, r.yearsOfExperience = $yearsOfExperience
    RETURN r.proficiency AS proficiency, r.yearsOfExperience AS yearsOfExperience
  `;
  const records = await runQuery(query, {
    userId,
    skillId,
    proficiency,
    yearsOfExperience
  });
  return records[0];
};

const updateUserSkill = async (userId, skillId, updateData) => {
  const { proficiency, yearsOfExperience } = updateData;
  const setClauses = [];
  const params = { userId, skillId };

  if (proficiency !== undefined) {
    setClauses.push('r.proficiency = $proficiency');
    params.proficiency = proficiency;
  }
  if (yearsOfExperience !== undefined) {
    setClauses.push('r.yearsOfExperience = $yearsOfExperience');
    params.yearsOfExperience = yearsOfExperience;
  }

  if (setClauses.length === 0) return null;

  const query = `
    MATCH (u:User { id: $userId })-[r:HAS_SKILL]->(s:Skill { id: $skillId })
    SET ${setClauses.join(', ')}
    RETURN r.proficiency AS proficiency, r.yearsOfExperience AS yearsOfExperience
  `;
  const records = await runQuery(query, params);
  if (records.length === 0) return null;
  return records[0];
};

const deleteUserSkill = async (userId, skillId) => {
  const query = `
    MATCH (u:User { id: $userId })-[r:HAS_SKILL]->(s:Skill { id: $skillId })
    DELETE r
    RETURN count(r) AS deletedCount
  `;
  const records = await runQuery(query, { userId, skillId });
  return records[0]?.deletedCount > 0;
};

const getTopicProgress = async (userId) => {
  const mongoTopicProgress = await UserTopicProgress.find({ userId });

  const topicCypher = `
    MATCH (u:User { id: $userId })-[:COMPLETED]->(t:LearningTopic)
    RETURN t.skillId AS skillId, t.title AS topicTitle
  `;
  let records = await runQuery(topicCypher, { userId });

  if (mongoTopicProgress.length !== records.length) {
    await runQuery('MATCH (u:User { id: $userId })-[r:COMPLETED]->() DELETE r', { userId });
    await runQuery('MERGE (u:User { id: $userId })', { userId });

    const batch = mongoTopicProgress.filter(tc => tc.skillId).map(tc => ({
      skillId: tc.skillId.toString(),
      topicTitle: tc.topicTitle
    }));

    if (batch.length > 0) {
      await runQuery(
        `UNWIND $batch AS item
         MERGE (s:Skill { id: item.skillId })`,
        { batch }
      );
      await runQuery(
        `UNWIND $batch AS item
         MERGE (t:LearningTopic { title: item.topicTitle, skillId: item.skillId })`,
        { batch }
      );
      await runQuery(
        `UNWIND $batch AS item
         MATCH (s:Skill { id: item.skillId }), (t:LearningTopic { title: item.topicTitle, skillId: item.skillId })
         MERGE (s)-[:HAS_TOPIC]->(t)`,
        { batch }
      );
      await runQuery(
        `UNWIND $batch AS item
         MATCH (u:User { id: $userId }), (t:LearningTopic { title: item.topicTitle, skillId: item.skillId })
         MERGE (u)-[:COMPLETED]->(t)`,
        { userId, batch }
      );
    }
    records = await runQuery(topicCypher, { userId });
  }

  return records.map(r => ({
    _id: `${userId}_${r.skillId}_${r.topicTitle}`,
    userId,
    skillId: r.skillId,
    topicTitle: r.topicTitle,
    completed: true
  }));
};

const completeTopic = async (userId, skillId, topicTitle, completed) => {
  await runQuery('MERGE (u:User { id: $userId })', { userId });
  await runQuery('MERGE (s:Skill { id: $skillId })', { skillId });

  if (completed) {
    await runQuery(
      `MERGE (t:LearningTopic { title: $topicTitle, skillId: $skillId })`,
      { topicTitle, skillId }
    );
    await runQuery(
      `MATCH (s:Skill { id: $skillId }), (t:LearningTopic { title: $topicTitle, skillId: $skillId })
       MERGE (s)-[:HAS_TOPIC]->(t)`,
      { skillId, topicTitle }
    );
    await runQuery(
      `MATCH (u:User { id: $userId }), (t:LearningTopic { title: $topicTitle, skillId: $skillId })
       MERGE (u)-[:COMPLETED]->(t)`,
      { userId, skillId, topicTitle }
    );
    return {
      _id: `${userId}_${skillId}_${topicTitle}`,
      userId,
      skillId,
      topicTitle,
      completed: true
    };
  } else {
    await runQuery(
      `MATCH (u:User { id: $userId })-[r:COMPLETED]->(t:LearningTopic { title: $topicTitle, skillId: $skillId })
       DELETE r`,
      { userId, skillId, topicTitle }
    );
    return null;
  }
};

const startLearningResource = async (userId, resourceId) => {
  const LearningResource = require('../models/LearningResource');
  const lr = await LearningResource.findById(resourceId).populate('skillId');
  if (!lr) return null;

  await runQuery('MERGE (u:User { id: $userId })', { userId });
  const resId = lr._id.toString();

  await runQuery(
    `MERGE (r:LearningResource { id: $resId })
     SET r.title = $title, r.provider = $provider, r.type = $type, r.url = $url,
         r.difficulty = $difficulty, r.estimatedHours = $estimatedHours`,
    {
      resId,
      title: lr.title,
      provider: lr.provider || '',
      type: lr.type || '',
      url: lr.url || '',
      difficulty: lr.difficulty || '',
      estimatedHours: lr.estimatedHours || 0
    }
  );

  if (lr.skillId) {
    const skillId = lr.skillId._id.toString();
    await runQuery('MERGE (s:Skill { id: $skillId })', { skillId });
    await runQuery(
      `MATCH (r:LearningResource { id: $resId }), (s:Skill { id: $skillId })
       MERGE (r)-[:TEACHES]->(s)`,
      { resId, skillId }
    );
  }

  const nowStr = new Date().toISOString();
  const result = await runQuery(
    `MATCH (u:User { id: $userId }), (r:LearningResource { id: $resId })
     MERGE (u)-[e:ENROLLED_IN]->(r)
     ON CREATE SET e.status = 'in_progress', e.progressPercentage = 0, e.startedAt = $nowStr
     RETURN e.status AS status, e.progressPercentage AS progressPercentage, e.startedAt AS startedAt, e.completedAt AS completedAt`,
    { userId, resId, nowStr }
  );

  if (result.length > 0) {
    const e = result[0];
    return {
      _id: `${userId}_${resId}`,
      userId,
      resourceId,
      status: e.status,
      progressPercentage: e.progressPercentage,
      startedAt: e.startedAt ? new Date(e.startedAt) : null,
      completedAt: e.completedAt ? new Date(e.completedAt) : null
    };
  }
  return null;
};

const updateLearningProgress = async (userId, resourceId, progressPercentage) => {
  const percent = Math.max(0, Math.min(100, progressPercentage));
  const status = percent === 100 ? 'completed' : 'in_progress';
  const completedAt = percent === 100 ? new Date().toISOString() : null;

  const result = await runQuery(
    `MATCH (u:User { id: $userId })-[e:ENROLLED_IN]->(r:LearningResource { id: $resourceId })
     SET e.progressPercentage = $percent, e.status = $status, e.completedAt = $completedAt
     RETURN e.status AS status, e.progressPercentage AS progressPercentage, e.startedAt AS startedAt, e.completedAt AS completedAt`,
    { userId, resourceId, percent, status, completedAt }
  );

  if (result.length > 0) {
    const e = result[0];
    return {
      _id: `${userId}_${resourceId}`,
      userId,
      resourceId,
      status: e.status,
      progressPercentage: e.progressPercentage,
      startedAt: e.startedAt ? new Date(e.startedAt) : null,
      completedAt: e.completedAt ? new Date(e.completedAt) : null
    };
  }
  return null;
};

const completeLearningResource = async (userId, resourceId) => {
  const LearningResource = require('../models/LearningResource');
  const lr = await LearningResource.findById(resourceId).populate('skillId');
  if (!lr) return null;

  await runQuery('MERGE (u:User { id: $userId })', { userId });
  const resId = lr._id.toString();

  await runQuery(
    `MERGE (r:LearningResource { id: $resId })
     SET r.title = $title, r.provider = $provider, r.type = $type, r.url = $url,
         r.difficulty = $difficulty, r.estimatedHours = $estimatedHours`,
    {
      resId,
      title: lr.title,
      provider: lr.provider || '',
      type: lr.type || '',
      url: lr.url || '',
      difficulty: lr.difficulty || '',
      estimatedHours: lr.estimatedHours || 0
    }
  );

  if (lr.skillId) {
    const skillId = lr.skillId._id.toString();
    await runQuery('MERGE (s:Skill { id: $skillId })', { skillId });
    await runQuery(
      `MATCH (r:LearningResource { id: $resId }), (s:Skill { id: $skillId })
       MERGE (r)-[:TEACHES]->(s)`,
      { resId, skillId }
    );
  }

  const nowStr = new Date().toISOString();
  const result = await runQuery(
    `MATCH (u:User { id: $userId }), (r:LearningResource { id: $resId })
     MERGE (u)-[e:ENROLLED_IN]->(r)
     ON CREATE SET e.startedAt = $nowStr
     SET e.status = 'completed', e.progressPercentage = 100, e.completedAt = $nowStr
     RETURN e.status AS status, e.progressPercentage AS progressPercentage, e.startedAt AS startedAt, e.completedAt AS completedAt`,
    { userId, resId, nowStr }
  );

  if (result.length > 0) {
    const e = result[0];
    return {
      _id: `${userId}_${resId}`,
      userId,
      resourceId,
      status: e.status,
      progressPercentage: e.progressPercentage,
      startedAt: e.startedAt ? new Date(e.startedAt) : null,
      completedAt: e.completedAt ? new Date(e.completedAt) : null
    };
  }
  return null;
};

module.exports = {
  getUserSkills,
  getCareerRequirements,
  getSkillGaps,
  getSkillGraph,
  getLearningProgress,
  getJobMatches,
  getRecommendations,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill,
  getTopicProgress,
  completeTopic,
  startLearningResource,
  updateLearningProgress,
  completeLearningResource,
  runQuery
};
