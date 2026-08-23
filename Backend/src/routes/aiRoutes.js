const express = require('express');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/status', aiController.getAIStatus);

router.use(protect);
router.post('/career-assistant', aiController.getCareerGuidance);

module.exports = router;
