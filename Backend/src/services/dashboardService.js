const User = require('../models/User');
const Skill = require('../models/Skill');
const Role = require('../models/Role');
const UserSkill = require('../models/UserSkill');
const Project = require('../models/Project');
const DailyActivity = require('../models/DailyActivity');
const Topic = require('../models/Topic');
const UserTopicProgress = require('../models/UserTopicProgress');
const teamService = require('./teamService');
const skillGapService = require('./skillGapService');

const getDashboardSummary = async () => {
  const totalUsers = await User.countDocuments();
  const totalSkills = await Skill.countDocuments();
  const totalRoles = await Role.countDocuments();

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
    averageSkillProficiency,
    mostCommonSkills: teamAnalysis.mostCommonSkills,
    topSkillGaps: teamAnalysis.teamSkillGaps,
    roleReadinessSummary: {
      averageReadinessScore: averageRoleReadiness,
      rolesAnalyzed: roles.length,
      usersAnalyzed: users.length
    }
  };
};

const getUserCommandCenter = async (userId) => {
  const user = await User.findById(userId).populate('targetRoleId').populate('savedRoleIds');
  if (!user) {
    throw new Error('User not found');
  }

  // User Skills
  const userSkills = await UserSkill.find({ userId }).populate('skillId').lean();
  const verifiedCount = userSkills.filter(us => us.verified || us.verificationStatus === 'verified').length;

  // Projects
  const projects = await Project.find({ userId }).populate('skillsUsed').lean();

  // Activities & Streak
  const allActivities = await DailyActivity.find({ userId }).sort({ createdAt: -1 }).lean();
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

  // Calculate Career Readiness and Gaps if target role is set
  let readiness = null;
  let topGaps = [];
  let continueTopics = [];

  if (user.targetRoleId) {
    try {
      const gapData = await skillGapService.calculateGap(userId, user.targetRoleId._id);
      readiness = {
        score: gapData.readinessScore,
        matchedSkills: gapData.matchedSkills,
        missingSkills: gapData.missingSkills,
        skillsToImprove: gapData.skillsToImprove,
        targetRole: {
          id: user.targetRoleId._id,
          name: user.targetRoleId.name,
          level: user.targetRoleId.level
        }
      };

      // Extract top gaps (status !== 'mastered')
      topGaps = gapData.skills
        .filter(s => s.status !== 'mastered')
        .sort((a, b) => {
          const weightDiff = (b.importance === 'required' ? 3 : 2) - (a.importance === 'required' ? 3 : 2);
          if (weightDiff !== 0) return weightDiff;
          return b.gap - a.gap;
        })
        .slice(0, 5);

      // Find next incomplete topics
      const completedProgress = await UserTopicProgress.find({ userId }).select('topicId').lean();
      const completedTopicIds = new Set(completedProgress.map(p => p.topicId.toString()));

      // Target role skills
      const roleSkillIds = gapData.skills.map(s => s.skill.id);
      const availableTopics = await Topic.find({ skillId: { $in: roleSkillIds } })
        .populate('skillId', 'name category')
        .sort({ order: 1 })
        .lean();

      continueTopics = availableTopics
        .filter(t => !completedTopicIds.has(t._id.toString()))
        .slice(0, 4);

    } catch (err) {
      console.warn('Could not compute target role readiness:', err.message);
    }
  }

  // If no continue topics found from target role, take from any skill the user has logged
  if (continueTopics.length === 0 && userSkills.length > 0) {
    const userSkillIds = userSkills.filter(us => us.skillId).map(us => us.skillId._id);
    const completedProgress = await UserTopicProgress.find({ userId }).select('topicId').lean();
    const completedTopicIds = new Set(completedProgress.map(p => p.topicId.toString()));

    const fallbackTopics = await Topic.find({ skillId: { $in: userSkillIds } })
      .populate('skillId', 'name category')
      .sort({ order: 1 })
      .lean();

    continueTopics = fallbackTopics
      .filter(t => !completedTopicIds.has(t._id.toString()))
      .slice(0, 4);
  }

  // Quick stats summary
  const quickStats = {
    totalSkills: userSkills.length,
    verifiedSkills: verifiedCount,
    verificationRate: userSkills.length > 0 ? Math.round((verifiedCount / userSkills.length) * 100) : 0,
    totalProjects: projects.length,
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
    recentActivity: allActivities.slice(0, 8),
    recentProjects: projects.slice(0, 4)
  };
};

module.exports = {
  getDashboardSummary,
  getUserCommandCenter
};
