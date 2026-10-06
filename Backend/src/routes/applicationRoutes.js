const express = require('express');
const jobController = require('../controllers/jobController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', jobController.getMyApplications);
router.get('/', restrictTo('admin', 'manager'), jobController.getAllApplications);
router.get('/candidates', restrictTo('admin', 'manager'), jobController.getAllApplications);
router.get('/:id', jobController.getApplicationById);
router.put('/:id/status', jobController.updateApplicationStatus);

module.exports = router;
