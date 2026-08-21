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

module.exports = {
  getRecommendations
};
