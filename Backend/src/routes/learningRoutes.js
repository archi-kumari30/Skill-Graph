const express = require('express');
const learningController = require('../controllers/learningController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my-progress', learningController.getMyProgress);
router.get('/resources', learningController.getAllResources);
router.get('/topics/progress', learningController.getTopicProgress);
router.post('/topics/complete', learningController.completeTopic);
router.post('/:resourceId/start', learningController.startResource);
router.put('/:resourceId/progress', learningController.updateProgress);
router.post('/:resourceId/complete', learningController.completeResource);

module.exports = router;
