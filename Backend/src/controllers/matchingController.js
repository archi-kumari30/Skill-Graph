const matchingService = require('../services/matchingService');
const { catchAsync } = require('../utils/helpers');

const getRoleMatches = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const matches = await matchingService.matchUserToRoles(userId);
  res.status(200).json({
    success: true,
    data: { matches }
  });
});

module.exports = {
  getRoleMatches
};
