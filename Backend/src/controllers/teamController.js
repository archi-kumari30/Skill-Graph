const teamService = require('../services/teamService');
const { catchAsync } = require('../utils/helpers');

const getTeamSkillAnalysis = catchAsync(async (req, res, next) => {
  const analysis = await teamService.getTeamSkillAnalysis(req.query);
  res.status(200).json({
    success: true,
    data: analysis
  });
});

const getTeamRoleReadiness = catchAsync(async (req, res, next) => {
  const { roleId } = req.params;
  const readiness = await teamService.getTeamRoleReadiness(roleId, req.query);
  res.status(200).json({
    success: true,
    data: readiness
  });
});

const simulateTraining = catchAsync(async (req, res, next) => {
  const { roleId, hypotheticalChanges, filters } = req.body;
  const simulation = await teamService.simulateTeamReadiness(roleId, hypotheticalChanges, filters);
  res.status(200).json({
    success: true,
    data: simulation
  });
});

module.exports = {
  getTeamSkillAnalysis,
  getTeamRoleReadiness,
  simulateTraining
};
