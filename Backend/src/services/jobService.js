const Job = require('../models/Job');
const UserSkill = require('../models/UserSkill');
const User = require('../models/User');
const Company = require('../models/Company');
const Skill = require('../models/Skill');
const JobApplication = require('../models/JobApplication');
const graphService = require('./graphService');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../utils/customErrors');
const { formatPaginatedResponse } = require('../utils/helpers');

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const generateJobMatchExplanation = (title, matchScore, matchedCount, missingCount, improveCount) => {
  if (matchScore >= 80) {
    return `Excellent match (Score: ${matchScore}%). You satisfy almost all core required proficiencies for the ${title} position. You have ${matchedCount} mastered requirements and only need minor adjustments.`;
  } else if (matchScore >= 50) {
    return `Good match (Score: ${matchScore}%). You meet several requirements for ${title}, but there are ${missingCount} missing skill(s) and ${improveCount} skill(s) that require proficiency upgrades.`;
  } else {
    return `Gap warning (Score: ${matchScore}%). There is a significant divergence between your current profile and the required skill levels. You are missing ${missingCount} key skill(s). We recommend completing the prerequisite learning paths first.`;
  }
};

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
      requiredProficiency: req.requiredProficiency,
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

const getJobs = async (filters = {}) => {
  const query = {};

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
    query.employmentType = filters.employmentType;
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
    .sort({ postedAt: -1 });

  return jobs;
};

const getJobById = async (jobId) => {
  const job = await Job.findById(jobId)
    .populate('companyId')
    .populate('requirements.skillId');

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

  // 1. Fetch user skills
  const userSkills = await UserSkill.find({ userId });
  const userSkillMap = {};
  userSkills.forEach(us => {
    if (us.skillId) {
      userSkillMap[us.skillId.toString()] = us.proficiency;
    }
  });

  // 2. Fetch all jobs
  const jobs = await Job.find()
    .populate('companyId')
    .populate('requirements.skillId');

  const matches = [];

  for (const job of jobs) {
    const analysis = calculateJobMatch(job, userSkillMap);

    matches.push({
      jobId: job._id,
      title: job.title,
      company: {
        id: job.companyId?._id,
        name: job.companyId?.name || 'Unknown Company',
        description: job.companyId?.description,
        industry: job.companyId?.industry,
        website: job.companyId?.website,
        location: job.companyId?.location
      },
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      salaryRange: job.salaryRange,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryCurrency: job.salaryCurrency,
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
      sourceUrl: job.sourceUrl
    });
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
};

const applyForJob = async (userId, jobId, applicationData = {}) => {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const { resumeUrl, notes } = applicationData;
  if (resumeUrl !== undefined && resumeUrl !== null && resumeUrl !== '') {
    if (!isValidUrl(resumeUrl)) {
      throw new BadRequestError('Invalid resumeUrl format. Must be a valid HTTP or HTTPS URL.');
    }
  }

  const existing = await JobApplication.findOne({ userId, jobId });
  if (existing) {
    throw new ConflictError('You have already applied for this position');
  }

  const application = await JobApplication.create({
    userId,
    jobId,
    resumeUrl: resumeUrl ? resumeUrl.trim() : '',
    notes: notes ? notes.trim() : '',
    status: 'applied',
    appliedAt: new Date()
  });

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

const updateApplicationStatus = async (applicationId, user, newStatus) => {
  const application = await JobApplication.findById(applicationId);
  if (!application) {
    throw new NotFoundError('Job application not found');
  }

  const allowedStatuses = ['applied', 'screening', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn'];
  if (!allowedStatuses.includes(newStatus)) {
    throw new BadRequestError(`Invalid status. Allowed values: ${allowedStatuses.join(', ')}`);
  }

  const isAdminOrManager = user.accountRole === 'admin' || user.accountRole === 'manager';
  const isOwner = application.userId.toString() === user._id.toString();

  if (!isAdminOrManager) {
    if (!isOwner) {
      throw new ForbiddenError('You are not authorized to update this application');
    }
    if (newStatus !== 'withdrawn') {
      throw new ForbiddenError('Students can only withdraw their own application');
    }
  }

  const oldStatus = application.status;
  application.status = newStatus;
  await application.save();

  if (isAdminOrManager) {
    const auditService = require('./auditService');
    await auditService.logAction({
      actorId: user._id,
      action: 'JOB_APPLICATION_STATUS_UPDATE',
      targetEntity: 'JobApplication',
      targetId: application._id,
      changes: { oldStatus, newStatus }
    });
  }

  return application;
};

const getMarketAnalytics = async () => {
  const totalOpenings = await Job.countDocuments();

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

  const remoteJobsCount = await Job.countDocuments({ location: { $regex: /remote/i } });
  const remotePercentage = totalOpenings > 0 ? Math.round((remoteJobsCount / totalOpenings) * 100) : 0;

  return {
    totalOpenings,
    topSkills,
    avgSalary,
    remotePercentage
  };
};

module.exports = {
  getJobs,
  getJobById,
  getJobMatches,
  calculateJobMatch,
  applyForJob,
  getUserApplications,
  updateApplicationStatus,
  getMarketAnalytics
};
