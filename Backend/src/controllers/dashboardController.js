const dashboardService = require('../services/dashboardService');
const { catchAsync } = require('../utils/helpers');

const getSummary = catchAsync(async (req, res, next) => {
  const summary = await dashboardService.getDashboardSummary();
  res.status(200).json({
    success: true,
    data: summary
  });
});

module.exports = {
  getSummary
};
