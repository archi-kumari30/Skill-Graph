const skillGapService = require('../services/skillGapService');
const { catchAsync } = require('../utils/helpers');

const getGapAnalysis = catchAsync(async (req, res, next) => {
  const userId = req.params.userId || req.user._id;
  const roleId = req.params.roleId || req.user.targetRoleId;

  if (!roleId) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Target role not specified. Please provide a roleId or set a target role on your profile.'
      }
    });
  }

  const gapAnalysis = await skillGapService.calculateGap(userId, roleId);
  res.status(200).json({
    success: true,
    data: gapAnalysis
  });
});

module.exports = {
  getGapAnalysis
};
