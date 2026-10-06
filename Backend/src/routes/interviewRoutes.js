const express = require('express');
const interviewController = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', interviewController.getInterviewQuestions);
router.get('/:id', interviewController.getQuestionById);
router.post('/:id/toggle-mastered', interviewController.toggleMastered);

module.exports = router;
