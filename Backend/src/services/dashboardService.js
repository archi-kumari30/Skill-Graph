const User = require('../models/User');
const Skill = require('../models/Skill');
const Role = require('../models/Role');
const UserSkill = require('../models/UserSkill');
const teamService = require('./teamService');

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

  const skillGapService = require('./skillGapService');
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

module.exports = {
  getDashboardSummary
};
