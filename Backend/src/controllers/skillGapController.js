const skillGapService = require('../services/skillGapService');
const { catchAsync } = require('../utils/helpers');

const getGapAnalysis = catchAsync(async (req, res, next) => {
  const { userId, roleId } = req.params;
  const gapAnalysis = await skillGapService.calculateGap(userId, roleId);
  res.status(200).json({
    success: true,
    data: gapAnalysis
  });
});

module.exports = {
  getGapAnalysis
};
