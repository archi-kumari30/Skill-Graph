const recommendationService = require('../services/recommendationService');
const { catchAsync } = require('../utils/helpers');

const getRecommendations = catchAsync(async (req, res, next) => {
  const { userId, roleId } = req.params;
  const recommendations = await recommendationService.getRecommendations(userId, roleId);
  res.status(200).json({
    success: true,
    data: { recommendations }
  });
});

const getMyRecommendations = catchAsync(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const { roleId } = req.params;
  const recommendations = await recommendationService.getRecommendations(userId, roleId);
  res.status(200).json({
    success: true,
    data: { recommendations }
  });
});

const getQuickWins = catchAsync(async (req, res, next) => {
  const userId = req.user._id || req.user.id;
  const quickWins = await recommendationService.getQuickWins(userId);
  res.status(200).json({
    success: true,
    data: { quickWins }
  });
});

module.exports = {
  getRecommendations,
  getMyRecommendations,
  getQuickWins
};
