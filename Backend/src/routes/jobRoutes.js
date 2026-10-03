const express = require('express');
const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', jobController.getJobs);
router.get('/matches', jobController.getJobMatches);
router.get('/analytics', jobController.getMarketAnalytics);
router.get('/my-applications', jobController.getMyApplications);
router.get('/:id', jobController.getJobById);
router.post('/:id/apply', jobController.applyForJob);
router.put('/applications/:id/status', jobController.updateApplicationStatus);

module.exports = router;
