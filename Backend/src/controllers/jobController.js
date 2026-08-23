const jobService = require('../services/jobService');

const getJobMatches = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const matches = await jobService.getJobMatches(userId);
    res.status(200).json({
      success: true,
      data: {
        matches
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobMatches
};
