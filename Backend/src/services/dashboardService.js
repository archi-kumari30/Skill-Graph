const User = require('../models/User');
const Skill = require('../models/Skill');
const Role = require('../models/Role');
const UserSkill = require('../models/UserSkill');
const Project = require('../models/Project');
const DailyActivity = require('../models/DailyActivity');
const Topic = require('../models/Topic');
const UserTopicProgress = require('../models/UserTopicProgress');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const skillGapService = require('./skillGapService');

const getDashboardSummary = async () => {
  const totalUsers = await User.countDocuments();
  const totalSkills = await Skill.countDocuments();
  const totalRoles = await Role.countDocuments();
  const totalJobs = await Job.countDocuments();
  const activeJobs = await Job.countDocuments({ status: { $in: ['Active', 'active'] } });
  const totalApplications = await JobApplication.countDocuments();

  // Top required skills across all job openings
  const topRequiredSkills = await Job.aggregate([
    { $unwind: '$requirements' },
    {
      $group: {
        _id: '$requirements.skillId',
        count: { $sum: 1 },
        avgRequiredProficiency: { $avg: '$requirements.requiredProficiency' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 8 },
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

  // Calculate average proficiency across all UserSkills in the system
  const userSkills = await UserSkill.find();
  let averageSkillProficiency = 0;
  if (userSkills.length > 0) {
    const sum = userSkills.reduce((acc, curr) => acc + curr.proficiency, 0);
    averageSkillProficiency = parseFloat((sum / userSkills.length).toFixed(2));
  }

  // Get common skills and gaps from the team analysis
  const teamAnalysis = await teamService.getTeamSkillAnalysis();

  // Compute a sample of organization-wide role readiness (up to 5 users against 5 roles)
  const roles = await Role.find().limit(5);
  const users = await User.find().limit(5);
  let totalReadiness = 0;
  let readinessCount = 0;

  for (const u of users) {
    for (const r of roles) {
      try {
        const gapAnalysis = await skillGapService.calculateGap(u._id, r._id);
        totalReadiness += gapAnalysis.readinessScore;
        readinessCount++;
      } catch (err) {
        // Skip combinations with error/no required skills
      }
    }
  }

  const averageRoleReadiness = readinessCount > 0
    ? Math.round(totalReadiness / readinessCount)
    : 100;

  return {
    totalUsers,
    totalSkills,
    totalRoles,
    totalJobs,
    activeJobs,
    totalApplications,
    topRequiredSkills,
    mostRequiredSkills: topRequiredSkills,
    averageSkillProficiency,
    mostCommonSkills: teamAnalysis.mostCommonSkills,
    topSkillGaps: teamAnalysis.teamSkillGaps,
    mostCommonSkillGaps: teamAnalysis.teamSkillGaps,
    roleReadinessSummary: {
      averageReadinessScore: averageRoleReadiness,
      rolesAnalyzed: roles.length,
      usersAnalyzed: users.length
    }
  };
};

// Optimized helper to compute top job matches for user from Job collection without heavy notifications or table scans
const getTopJobMatchesForDashboard = async (userId, userSkills) => {
  try {
    const userSkillMap = {};
    (userSkills || []).forEach(us => {
      const sid = us.skillId?._id ? us.skillId._id.toString() : (us.skillId ? us.skillId.toString() : null);
      if (sid) {
        userSkillMap[sid] = us.proficiency || 0;
      }
    });

    const jobs = await Job.find({ status: { $in: ['Active', 'active', null] } })
      .limit(20)
      .populate('companyId', 'name location industry website')
      .populate('requirements.skillId', 'name category')
      .lean();

    if (!jobs || jobs.length === 0) return [];

    const matches = jobs.map(job => {
      const reqs = job.requirements || [];
      let totalScore = 0;
      if (reqs.length === 0) {
        totalScore = 1;
      } else {
        let scoreSum = 0;
        let count = 0;
        for (const req of reqs) {
          const s = req.skillId;
          if (!s) continue;
          count++;
          const sId = s._id ? s._id.toString() : s.toString();
          const prof = userSkillMap[sId] || 0;
          if (prof >= 3) scoreSum += 1.0;
          else if (prof >= 1) scoreSum += 0.5;
        }
        totalScore = count > 0 ? (scoreSum / count) : 1;
      }
      const matchScore = Math.round(totalScore * 100);

      const companyName = job.companyId?.name || (typeof job.company === 'string' ? job.company : job.companyName) || 'Company';
      return {
        jobId: job._id,
        title: job.title,
        company: companyName,
        companyName: companyName,
        matchScore,
        location: job.location || 'Remote',
        workMode: job.workMode || 'Hybrid',
        salary: job.salary || job.salaryRange || ''
      };
    });

    matches.sort((a, b) => b.matchScore - a.matchScore);
    return matches.slice(0, 4);
  } catch (err) {
    console.warn('Could not compute fast top job matches for command center:', err.message);
    return [];
  }
};

const computeReadinessAndGaps = async (userId, user, userSkills) => {
  let readiness = null;
  let topGaps = [];
  let continueTopics = [];

  if (user.targetRoleId) {
    try {
      const targetRoleId = user.targetRoleId._id || user.targetRoleId;
      const gapData = await skillGapService.calculateGap(userId, targetRoleId);
      readiness = {
        score: gapData.readinessScore,
        matchedSkills: gapData.matchedSkills,
        missingSkills: gapData.missingSkills,
        skillsToImprove: gapData.skillsToImprove,
        targetRole: {
          id: targetRoleId,
          name: user.targetRoleId.name || 'Target Role',
          level: user.targetRoleId.level || 'Mid'
        }
      };

      // Extract top gaps (status !== 'mastered')
      topGaps = (gapData.skills || [])
        .filter(s => s.status !== 'mastered')
        .sort((a, b) => {
          const weightDiff = (b.importance === 'required' ? 3 : 2) - (a.importance === 'required' ? 3 : 2);
          if (weightDiff !== 0) return weightDiff;
          return (b.gap || 0) - (a.gap || 0);
        })
        .slice(0, 5);

      // Find next incomplete topics
      const completedProgress = await UserTopicProgress.find({ userId }).select('topicTitle').lean();
      const completedTopicTitles = new Set(completedProgress.map(p => p.topicTitle).filter(Boolean));

      // Target role skills
      const roleSkillIds = (gapData.skills || []).map(s => s.skill?.id || s.skill?._id || s.skillId).filter(Boolean);
      const availableTopics = await Topic.find({ skillId: { $in: roleSkillIds } })
        .populate('skillId', 'name category')
        .sort({ order: 1 })
        .lean();

      continueTopics = availableTopics
        .filter(t => !completedTopicTitles.has(t.title))
        .slice(0, 4);

    } catch (err) {
      console.warn('Could not compute target role readiness:', err.message);
    }
  }

  // If no continue topics found from target role, take from any skill the user has logged
  if (continueTopics.length === 0 && userSkills.length > 0) {
    const userSkillIds = userSkills.filter(us => us.skillId).map(us => us.skillId._id || us.skillId);
    const completedProgress = await UserTopicProgress.find({ userId }).select('topicTitle').lean();
    const completedTopicTitles = new Set(completedProgress.map(p => p.topicTitle).filter(Boolean));

    const fallbackTopics = await Topic.find({ skillId: { $in: userSkillIds } })
      .populate('skillId', 'name category')
      .sort({ order: 1 })
      .lean();

    continueTopics = fallbackTopics
      .filter(t => !completedTopicTitles.has(t.title))
      .slice(0, 4);
  }

  return { readiness, topGaps, continueTopics };
};

const getUserCommandCenter = async (userId) => {
  // Concurrently fetch user-scoped documents in parallel
  const [user, userSkills, projects, allActivities, userApps] = await Promise.all([
    User.findById(userId).populate('targetRoleId').populate('savedRoleIds').lean(),
    UserSkill.find({ userId }).populate('skillId').lean(),
    Project.find({ userId }).populate('skillsUsed').lean(),
    DailyActivity.find({ userId }).sort({ createdAt: -1 }).lean(),
    JobApplication.find({ userId }).lean()
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  const verifiedCount = userSkills.filter(us => us.verified || us.verificationStatus === 'verified').length;

  // Activities & Streak
  const activeDatesSet = new Set(allActivities.map(a => a.date));

  // Calculate streak
  let streak = 0;
  const d = new Date();
  const formatDate = (date) => date.toISOString().split('T')[0];
  const todayStr = formatDate(d);
  d.setDate(d.getDate() - 1);
  const yesterdayStr = formatDate(d);

  let checkDate = new Date();
  if (!activeDatesSet.has(todayStr)) {
    if (activeDatesSet.has(yesterdayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      streak = 0;
    }
  }

  if (activeDatesSet.has(todayStr) || activeDatesSet.has(yesterdayStr)) {
    while (true) {
      const checkStr = formatDate(checkDate);
      if (activeDatesSet.has(checkStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // 7-day study minutes
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysAgoStr = formatDate(sevenDaysAgo);

  let minutesThisWeek = 0;
  allActivities.forEach(a => {
    if (a.date >= sevenDaysAgoStr) {
      minutesThisWeek += (a.minutesSpent || 0);
    }
  });

  // Concurrently calculate readiness/gaps and top job matches in parallel
  const [readinessResult, topJobMatches] = await Promise.all([
    computeReadinessAndGaps(userId, user, userSkills),
    getTopJobMatchesForDashboard(userId, userSkills)
  ]);

  const { readiness, topGaps, continueTopics } = readinessResult;

  // Compute real application metrics
  const applicationStats = {
    total: userApps.length,
    applied: userApps.filter(a => a.status === 'applied').length,
    interview: userApps.filter(a => a.status === 'interview' || a.status === 'interviewing').length,
    offers: userApps.filter(a => a.status === 'offered').length,
    shortlisted: userApps.filter(a => a.status === 'shortlisted').length,
    rejected: userApps.filter(a => a.status === 'rejected').length
  };

  // Quick stats summary
  const quickStats = {
    totalSkills: userSkills.length,
    verifiedSkills: verifiedCount,
    verifiedSkillsCount: verifiedCount,
    verificationRate: userSkills.length > 0 ? Math.round((verifiedCount / userSkills.length) * 100) : 0,
    totalProjects: projects.length,
    streak: streak,
    streakDays: streak,
    hoursThisWeek: parseFloat((minutesThisWeek / 60).toFixed(1)),
    readinessScore: readiness ? readiness.score : 0,
    weeklyGoalHours: user.weeklyStudyHours || 10
  };

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      department: user.department,
      accountRole: user.accountRole,
      targetRole: user.targetRoleId,
      savedRoles: user.savedRoleIds,
      onboardingCompleted: user.onboardingCompleted,
      experienceLevel: user.experienceLevel,
      weeklyStudyHours: user.weeklyStudyHours,
      primaryFocus: user.primaryFocus
    },
    quickStats,
    readiness,
    topGaps,
    continueTopics,
    jobMatches: topJobMatches,
    topMatches: topJobMatches,
    applicationStats,
    recentActivity: allActivities.slice(0, 8),
    recentProjects: projects.slice(0, 4)
  };
};

const getRecruiterDashboard = async (userId, userRole) => {
  let jobFilter = { recruiterId: userId };
  if (userRole === 'admin') {
    const myCount = await Job.countDocuments({ recruiterId: userId });
    if (myCount === 0) {
      jobFilter = {};
    }
  }

  const jobs = await Job.find(jobFilter).populate('companyId', 'name logo').sort({ createdAt: -1 }).lean();
  const jobIds = jobs.map(j => j._id);

  const applications = await JobApplication.find({ jobId: { $in: jobIds } })
    .populate('jobId', 'title location department status')
    .sort({ createdAt: -1 })
    .lean();

  const activeJobs = jobs.filter(j => j.status === 'Active' || j.status === 'active');

  const pipeline = {
    applied: 0,
    reviewing: 0,
    shortlisted: 0,
    interview: 0,
    offered: 0,
    rejected: 0
  };

  const applicantsByJob = {};
  applications.forEach(a => {
    const jId = a.jobId?._id?.toString() || a.jobId?.toString();
    if (jId) applicantsByJob[jId] = (applicantsByJob[jId] || 0) + 1;
    const st = a.status || 'applied';
    if (pipeline[st] !== undefined) {
      pipeline[st]++;
    } else {
      pipeline.applied++;
    }
  });

  const jobsWithCount = jobs.map(j => ({
    ...j,
    applicantsCount: applicantsByJob[j._id.toString()] || 0
  }));

  const recentApplications = applications.slice(0, 8).map(a => ({
    _id: a._id,
    fullName: a.fullName || 'Candidate',
    email: a.email,
    phone: a.phone || '',
    jobTitle: a.jobId?.title || 'Position',
    jobId: a.jobId?._id || a.jobId,
    status: a.status,
    matchScore: a.matchScore,
    resumeUrl: a.resumeUrl,
    portfolioUrl: a.portfolioUrl,
    createdAt: a.createdAt
  }));

  return {
    totalJobs: jobs.length,
    activeJobsCount: activeJobs.length,
    totalApplicants: applications.length,
    pipeline,
    recentApplications,
    myJobs: jobsWithCount
  };
};

module.exports = {
  getDashboardSummary,
  getUserCommandCenter,
  getRecruiterDashboard
};

