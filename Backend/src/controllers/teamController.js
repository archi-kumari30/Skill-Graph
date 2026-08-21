const teamService = require('../services/teamService');
const { catchAsync } = require('../utils/helpers');

const getTeamSkillAnalysis = catchAsync(async (req, res, next) => {
  const analysis = await teamService.getTeamSkillAnalysis();
  res.status(200).json({
    success: true,
    data: analysis
  });
});

const getTeamRoleReadiness = catchAsync(async (req, res, next) => {
  const { roleId } = req.params;
  const readiness = await teamService.getTeamRoleReadiness(roleId);
  res.status(200).json({
    success: true,
    data: readiness
  });
});

module.exports = {
  getTeamSkillAnalysis,
  getTeamRoleReadiness
};
