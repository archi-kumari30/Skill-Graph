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

  if (process.env.USE_GRAPH_DB === 'true') {
    return await graphService.getSkillGaps(userId, roleId);
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

  const scoringResult = calculateReadiness(roleSkills, userSkillMap, topicCompletionMap);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    role: {
      id: role._id,
      name: role.name,
      department: role.department
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
