const UserSkill = require('../models/UserSkill');
const RoleSkill = require('../models/RoleSkill');
const User = require('../models/User');
const Role = require('../models/Role');
const Skill = require('../models/Skill');
const graphService = require('./graphService');
const { NotFoundError } = require('../utils/customErrors');
const { calculateReadiness, getImportanceWeight } = require('../utils/scoring');

const calculateGap = async (userId, roleId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const role = await Role.findById(roleId);
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  const { getDriver } = require('../config/cognodb');
  if (process.env.USE_GRAPH_DB === 'true' && getDriver && getDriver()) {
    try {
      const graphTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('CognoDB query timeout after 2500ms')), 2500)
      );
      return await Promise.race([
        graphService.getSkillGaps(userId, roleId),
        graphTimeout
      ]);
    } catch (err) {
      console.warn('[COGNODB RESILIENCE] Falling back to MongoDB for skill gaps:', err.message);
    }
  }

  // Fetch role skill requirements
  const roleSkills = await RoleSkill.find({ roleId }).populate('skillId');

  // Fetch user skills
  const userSkills = await UserSkill.find({ userId });

  // Map user skill proficiencies for lookup
  const userSkillMap = {};
  userSkills.forEach(us => {
    if (us.skillId) {
      userSkillMap[us.skillId.toString()] = us.proficiency;
    }
  });

  const UserTopicProgress = require('../models/UserTopicProgress');
  const completedTopics = await UserTopicProgress.find({ userId });
  const topicCompletionMap = {};
  completedTopics.forEach(tp => {
    if (tp.skillId) {
      const sId = tp.skillId.toString();
      topicCompletionMap[sId] = (topicCompletionMap[sId] || 0) + 1;
    }
  });

  const Topic = require('../models/Topic');
  const topicCounts = await Topic.aggregate([
    { $group: { _id: '$skillId', count: { $sum: 1 } } }
  ]);
  const topicCountMap = {};
  topicCounts.forEach(tc => {
    if (tc._id) topicCountMap[tc._id.toString()] = tc.count;
  });

  const scoringResult = calculateReadiness(roleSkills, userSkillMap, topicCompletionMap, topicCountMap);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    role: {
      id: role._id,
      name: role.name,
      department: role.department,
      level: role.level || 'all'
    },
    readinessScore: scoringResult.readinessScore,
    matchedSkills: scoringResult.matchedSkills,
    missingSkills: scoringResult.missingSkills,
    skillsToImprove: scoringResult.skillsToImprove,
    skills: scoringResult.skills
  };
};

module.exports = {
  calculateGap,
  getImportanceWeight
};
