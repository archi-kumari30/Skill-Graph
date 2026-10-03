const jobService = require('../services/jobService');
const { catchAsync } = require('../utils/helpers');

const getJobs = catchAsync(async (req, res, next) => {
  const result = await jobService.getJobs(req.query);
  if (result && result.pagination) {
    return res.status(200).json({
      success: true,
      data: result
    });
  }
  res.status(200).json({
    success: true,
    data: { jobs: result }
  });
});

const getJobById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const job = await jobService.getJobById(id);
  res.status(200).json({
    success: true,
    data: { job }
  });
});

const getJobMatches = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const matches = await jobService.getJobMatches(userId);
  res.status(200).json({
    success: true,
    data: { matches }
  });
});

const applyForJob = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const { id } = req.params;
  const application = await jobService.applyForJob(userId, id, req.body);
  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { application }
  });
});

const getMyApplications = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const applications = await jobService.getUserApplications(userId);
  res.status(200).json({
    success: true,
    data: { applications }
  });
});

const updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const application = await jobService.updateApplicationStatus(id, req.user, status);
  res.status(200).json({
    success: true,
    message: 'Application status updated successfully',
    data: { application }
  });
});

const getMarketAnalytics = catchAsync(async (req, res, next) => {
  const analytics = await jobService.getMarketAnalytics();
  res.status(200).json({
    success: true,
    data: { analytics }
  });
});

module.exports = {
  getJobs,
  getJobById,
  getJobMatches,
  applyForJob,
  getMyApplications,
  updateApplicationStatus,
  getMarketAnalytics
};
