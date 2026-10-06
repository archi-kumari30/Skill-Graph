const express = require('express');
const jobController = require('../controllers/jobController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(jobController.getJobs)
  .post(restrictTo('admin', 'manager'), jobController.createJob);

router.get('/matches', jobController.getJobMatches);
router.get('/analytics', jobController.getMarketAnalytics);
router.get('/my-applications', jobController.getMyApplications);

// Application specific routes before parameterized job routes
router.get('/applications', restrictTo('admin', 'manager'), jobController.getAllApplications);
router.get('/applications/:id', jobController.getApplicationById);
router.put('/applications/:id/status', jobController.updateApplicationStatus);
router.patch('/applications/:id/status', jobController.updateApplicationStatus);

// Job specific subroutes
router.get('/:id/match', jobController.getJobMatch);
router.route('/:id/learning-path')
  .get(jobController.getJobLearningPath)
  .post(jobController.getJobLearningPath);

router.post('/:id/apply', jobController.applyForJob);

router.patch('/:id/status', restrictTo('admin', 'manager'), jobController.updateJob);

// Parameterized job routes last
router.route('/:id')
  .get(jobController.getJobById)
  .put(restrictTo('admin', 'manager'), jobController.updateJob)
  .patch(restrictTo('admin', 'manager'), jobController.updateJob)
  .delete(restrictTo('admin', 'manager'), jobController.deleteJob);

module.exports = router;
