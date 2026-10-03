const express = require('express');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/status', aiController.getAIStatus);

router.use(protect);

router.post('/chat/stream', aiController.streamChat);
router.post('/chat', aiController.chat);
router.post('/career-assistant', aiController.getCareerGuidance);
router.get('/history', aiController.getChatHistory);
router.delete('/history', aiController.clearChatHistory);

module.exports = router;
