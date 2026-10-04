const express = require('express');
const activityController = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', activityController.getActivitySummary);
router.post('/', activityController.logActivity);

module.exports = router;
