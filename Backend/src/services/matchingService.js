const Role = require('../models/Role');
const skillGapService = require('./skillGapService');

const matchUserToRoles = async (userId) => {
  const roles = await Role.find();
  const matches = [];

  for (const role of roles) {
    try {
      const gapAnalysis = await skillGapService.calculateGap(userId, role._id);
      matches.push({
        roleId: role._id,
        name: role.name,
        department: role.department,
        level: role.level,
        matchScore: gapAnalysis.readinessScore,
        matchedSkills: gapAnalysis.matchedSkills,
        missingSkills: gapAnalysis.missingSkills,
        skillsToImprove: gapAnalysis.skillsToImprove
      });
    } catch (err) {
      // If user or role is not found, or other error, skip this role
      continue;
    }
  }

  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};

module.exports = {
  matchUserToRoles
};
