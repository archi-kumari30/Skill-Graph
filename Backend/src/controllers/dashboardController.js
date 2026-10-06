const dashboardService = require('../services/dashboardService');
const { catchAsync } = require('../utils/helpers');

const getSummary = catchAsync(async (req, res, next) => {
  const summary = await dashboardService.getDashboardSummary();
  res.status(200).json({
    success: true,
    data: summary
  });
});

const getCommandCenter = catchAsync(async (req, res, next) => {
  const commandCenter = await dashboardService.getUserCommandCenter(req.user._id);
  res.status(200).json({
    success: true,
    data: commandCenter
  });
});

const getRecruiterDashboard = catchAsync(async (req, res, next) => {
  const data = await dashboardService.getRecruiterDashboard(req.user._id, req.user.accountRole);
  res.status(200).json({
    success: true,
    data
  });
});

module.exports = {
  getSummary,
  getCommandCenter,
  getRecruiterDashboard
};

