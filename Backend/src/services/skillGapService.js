const UserSkill = require('../models/UserSkill');
const RoleSkill = require('../models/RoleSkill');
const User = require('../models/User');
const Role = require('../models/Role');
const { NotFoundError } = require('../utils/customErrors');

const getImportanceWeight = (importance) => {
  switch (importance) {
    case 'required': return 3;
    case 'important': return 2;
    case 'nice_to_have': return 1;
    default: return 1;
  }
};

const calculateGap = async (userId, roleId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const role = await Role.findById(roleId);
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  // Fetch role skill requirements
  const roleSkills = await RoleSkill.find({ roleId }).populate('skillId');

  // Fetch user skills
  const userSkills = await UserSkill.find({ userId });

  // Map user skill proficiencies for lookup
  const userSkillMap = {};
  userSkills.forEach(us => {
    userSkillMap[us.skillId.toString()] = us.proficiency;
  });

  let totalWeightedMaxScore = 0;
  let totalWeightedUserScore = 0;
  let matchedSkillsCount = 0;
  let missingSkillsCount = 0;
  let skillsToImproveCount = 0;

  const skillGaps = roleSkills.map(rs => {
    const skill = rs.skillId;
    if (!skill) return null;

    const currentProficiency = userSkillMap[skill._id.toString()] || 0;
    const requiredProficiency = rs.requiredProficiency;
    const gap = Math.max(0, requiredProficiency - currentProficiency);
    const weight = getImportanceWeight(rs.importance);

    // Track scores for readiness percentage calculation
    totalWeightedMaxScore += weight * requiredProficiency;
    totalWeightedUserScore += weight * Math.min(currentProficiency, requiredProficiency);

    let status = 'missing';
    if (currentProficiency >= requiredProficiency) {
      status = 'mastered';
      matchedSkillsCount++;
    } else if (currentProficiency > 0) {
      status = 'needs_improvement';
      skillsToImproveCount++;
    } else {
      missingSkillsCount++;
    }

    return {
      skill: {
        id: skill._id,
        name: skill.name,
        category: skill.category
      },
      currentProficiency,
      requiredProficiency,
      gap,
      importance: rs.importance,
      status
    };
  }).filter(Boolean);

  const readinessScore = totalWeightedMaxScore > 0
    ? Math.round((totalWeightedUserScore / totalWeightedMaxScore) * 100)
    : 100;

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
    readinessScore,
    matchedSkills: matchedSkillsCount,
    missingSkills: missingSkillsCount,
    skillsToImprove: skillsToImproveCount,
    skills: skillGaps
  };
};

module.exports = {
  calculateGap,
  getImportanceWeight
};
