const User = require('../models/User');
const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const Role = require('../models/Role');
const RoleSkill = require('../models/RoleSkill');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const { getImportanceWeight } = require('./skillGapService');

const buildUserFilter = (filters = {}) => {
  const userQuery = {};
  if (filters.department) {
    userQuery.department = filters.department;
  }
  if (filters.branch) {
    userQuery.branch = filters.branch;
  }
  if (filters.college) {
    userQuery.college = filters.college;
  }
  return userQuery;
};

const getTeamSkillAnalysis = async (filters = {}) => {
  const userQuery = buildUserFilter(filters);
  const targetUsers = await User.find(userQuery).select('_id');
  const targetUserIds = targetUsers.map(u => u._id);
  const totalUsers = targetUserIds.length;

  if (totalUsers === 0) {
    return {
      totalUsers: 0,
      mostCommonSkills: [],
      missingSkills: [],
      averageProficiency: [],
      skillCoverage: [],
      teamSkillGaps: []
    };
  }

  // Fetch user skills for cohort
  const allUserSkills = await UserSkill.find({ userId: { $in: targetUserIds } })
    .populate('skillId', 'name category');

  // Group user skills by skillId
  const skillGroups = {};
  allUserSkills.forEach(us => {
    if (!us.skillId) return;
    const id = us.skillId._id.toString();
    if (!skillGroups[id]) {
      skillGroups[id] = {
        skill: us.skillId,
        users: [],
        proficiencies: []
      };
    }
    skillGroups[id].users.push(us.userId);
    skillGroups[id].proficiencies.push(us.proficiency);
  });

  // Calculate stats for each skill
  const skillCoverage = [];
  const averageProficiency = [];

  Object.keys(skillGroups).forEach(id => {
    const group = skillGroups[id];
    const count = group.users.length;
    const avgProf = group.proficiencies.reduce((a, b) => a + b, 0) / count;
    const coveragePercent = Math.round((count / totalUsers) * 100);

    skillCoverage.push({
      skill: { id: group.skill._id, name: group.skill.name, category: group.skill.category },
      count,
      percentage: coveragePercent
    });

    averageProficiency.push({
      skill: { id: group.skill._id, name: group.skill.name, category: group.skill.category },
      averageProficiency: parseFloat(avgProf.toFixed(2)),
      count
    });
  });

  // Most common skills (sorted by coverage count descending)
  const mostCommonSkills = [...skillCoverage]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Missing Skills: Required by roles but not possessed by any user in cohort
  const roleSkills = await RoleSkill.find().populate('skillId', 'name category');
  const requiredSkillIds = new Set();
  const roleSkillDetails = {};

  roleSkills.forEach(rs => {
    if (rs.skillId) {
      const id = rs.skillId._id.toString();
      requiredSkillIds.add(id);
      if (!roleSkillDetails[id]) {
        roleSkillDetails[id] = {
          skill: rs.skillId,
          rolesCount: 0
        };
      }
      roleSkillDetails[id].rolesCount++;
    }
  });

  const missingSkills = [];
  requiredSkillIds.forEach(id => {
    if (!skillGroups[id]) {
      const detail = roleSkillDetails[id];
      missingSkills.push({
        skill: { id: detail.skill._id, name: detail.skill.name, category: detail.skill.category },
        rolesDemanding: detail.rolesCount
      });
    }
  });

  // Team skill gaps
  const teamSkillGaps = [];
  for (const rs of roleSkills) {
    if (!rs.skillId) continue;
    const skillIdStr = rs.skillId._id.toString();
    const group = skillGroups[skillIdStr];
    const avgUserProf = group
      ? (group.proficiencies.reduce((a, b) => a + b, 0) / group.proficiencies.length)
      : 0;

    const gap = Math.max(0, rs.requiredProficiency - avgUserProf);
    if (gap > 0) {
      teamSkillGaps.push({
        skill: { id: rs.skillId._id, name: rs.skillId.name, category: rs.skillId.category },
        requiredProficiency: rs.requiredProficiency,
        averageUserProficiency: parseFloat(avgUserProf.toFixed(2)),
        averageGap: parseFloat(gap.toFixed(2)),
        importance: rs.importance
      });
    }
  }

  const sortedGaps = teamSkillGaps.sort((a, b) => {
    const scoreA = a.averageGap * getImportanceWeight(a.importance);
    const scoreB = b.averageGap * getImportanceWeight(b.importance);
    return scoreB - scoreA;
  }).slice(0, 5);

  return {
    totalUsers,
    mostCommonSkills,
    missingSkills,
    averageProficiency: averageProficiency.sort((a, b) => b.averageProficiency - a.averageProficiency),
    skillCoverage: skillCoverage.sort((a, b) => b.percentage - a.percentage),
    teamSkillGaps: sortedGaps
  };
};

const getTeamRoleReadiness = async (roleId, filters = {}) => {
  const role = await Role.findById(roleId);
  if (!role) {
    throw new NotFoundError('Role not found');
  }

  const roleSkills = await RoleSkill.find({ roleId }).populate('skillId');
  if (roleSkills.length === 0) {
    return {
      role: { id: role._id, name: role.name, department: role.department },
      teamReadinessScore: 100,
      skills: []
    };
  }

  const userQuery = buildUserFilter(filters);
  const targetUsers = await User.find(userQuery).select('_id');
  const targetUserIds = targetUsers.map(u => u._id);

  if (targetUserIds.length === 0) {
    return {
      role: {
        id: role._id,
        name: role.name,
        department: role.department
      },
      teamReadinessScore: 0,
      summary: {
        matchedSkills: 0,
        missingSkills: roleSkills.length,
        skillsToImprove: 0
      },
      skills: roleSkills.map(rs => ({
        skill: {
          id: rs.skillId?._id,
          name: rs.skillId?.name || 'Unknown',
          category: rs.skillId?.category
        },
        requiredProficiency: rs.requiredProficiency,
        teamMaxProficiency: 0,
        teamGap: rs.requiredProficiency,
        importance: rs.importance,
        status: 'missing',
        lead: null
      }))
    };
  }

  // Fetch user skills for cohort
  const allUserSkills = await UserSkill.find({ userId: { $in: targetUserIds } })
    .populate('userId', 'name email');

  // Group user skills by skillId
  const skillToUsersMap = {};
  allUserSkills.forEach(us => {
    if (us.skillId) {
      const sId = us.skillId.toString();
      if (!skillToUsersMap[sId]) {
        skillToUsersMap[sId] = [];
      }
      skillToUsersMap[sId].push({
        userId: us.userId ? us.userId._id : null,
        userName: us.userId ? us.userId.name : 'Unknown',
        proficiency: us.proficiency
      });
    }
  });

  let totalWeightedMaxScore = 0;
  let totalWeightedTeamScore = 0;
  let masteredCount = 0;
  let gapCount = 0;
  let missingCount = 0;

  const skillAnalysis = roleSkills.map(rs => {
    const skill = rs.skillId;
    if (!skill) return null;

    const skillIdStr = skill._id.toString();
    const usersWithSkill = skillToUsersMap[skillIdStr] || [];

    // Find the lead (user with maximum proficiency)
    let lead = null;
    let maxProf = 0;

    usersWithSkill.forEach(u => {
      if (u.proficiency > maxProf) {
        maxProf = u.proficiency;
        lead = {
          userId: u.userId,
          name: u.userName,
          proficiency: u.proficiency
        };
      }
    });

    const requiredProf = rs.requiredProficiency;
    const teamGap = Math.max(0, requiredProf - maxProf);
    const weight = getImportanceWeight(rs.importance);

    totalWeightedMaxScore += weight * requiredProf;
    totalWeightedTeamScore += weight * Math.min(maxProf, requiredProf);

    let status = 'missing';
    if (maxProf >= requiredProf) {
      status = 'mastered';
      masteredCount++;
    } else if (maxProf > 0) {
      status = 'needs_improvement';
      gapCount++;
    } else {
      missingCount++;
    }

    return {
      skill: {
        id: skill._id,
        name: skill.name,
        category: skill.category
      },
      requiredProficiency: requiredProf,
      teamMaxProficiency: maxProf,
      teamGap,
      importance: rs.importance,
      status,
      lead
    };
  }).filter(Boolean);

  const teamReadinessScore = totalWeightedMaxScore > 0
    ? Math.round((totalWeightedTeamScore / totalWeightedMaxScore) * 100)
    : 100;

  return {
    role: {
      id: role._id,
      name: role.name,
      department: role.department
    },
    teamReadinessScore,
    summary: {
      matchedSkills: masteredCount,
      missingSkills: missingCount,
      skillsToImprove: gapCount
    },
    skills: skillAnalysis
  };
};

const simulateTeamReadiness = async (roleId, hypotheticalChanges = [], filters = {}) => {
  if (!roleId) {
    throw new BadRequestError('roleId is required for simulation');
  }

  if (!Array.isArray(hypotheticalChanges)) {
    throw new BadRequestError('hypotheticalChanges must be an array of { skillId, proficiency }');
  }

  // Validate changes
  hypotheticalChanges.forEach(hc => {
    if (!hc.skillId || hc.proficiency === undefined || hc.proficiency < 1 || hc.proficiency > 5) {
      throw new BadRequestError('Each hypothetical change must have a valid skillId and proficiency between 1 and 5');
    }
  });

  const baseline = await getTeamRoleReadiness(roleId, filters);
  const baselineReadiness = baseline.teamReadinessScore;

  // Map hypothetical changes by skillId
  const changeMap = {};
  hypotheticalChanges.forEach(hc => {
    changeMap[hc.skillId.toString()] = hc.proficiency;
  });

  const roleSkills = await RoleSkill.find({ roleId }).populate('skillId');

  let totalWeightedMaxScore = 0;
  let simulatedTeamScore = 0;
  const resolvedGaps = [];

  roleSkills.forEach(rs => {
    if (!rs.skillId) return;
    const sId = rs.skillId._id.toString();
    const weight = getImportanceWeight(rs.importance);
    const requiredProf = rs.requiredProficiency;

    // Find baseline max proficiency for this skill
    const baselineSkill = baseline.skills.find(s => s.skill.id.toString() === sId);
    const currentMax = baselineSkill ? baselineSkill.teamMaxProficiency : 0;

    // Apply hypothetical proficiency if provided
    const simulatedProf = changeMap[sId] !== undefined
      ? Math.max(currentMax, changeMap[sId])
      : currentMax;

    totalWeightedMaxScore += weight * requiredProf;
    simulatedTeamScore += weight * Math.min(simulatedProf, requiredProf);

    if (currentMax < requiredProf && simulatedProf >= requiredProf) {
      resolvedGaps.push(rs.skillId.name);
    }
  });

  const projectedReadiness = totalWeightedMaxScore > 0
    ? Math.round((simulatedTeamScore / totalWeightedMaxScore) * 100)
    : 100;

  const readinessGain = Math.max(0, projectedReadiness - baselineReadiness);

  return {
    role: baseline.role,
    baselineReadiness,
    projectedReadiness,
    readinessGain,
    resolvedGaps,
    hypotheticalChanges
  };
};

module.exports = {
  getTeamSkillAnalysis,
  getTeamRoleReadiness,
  simulateTeamReadiness
};
