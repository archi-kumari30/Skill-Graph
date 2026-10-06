const express = require('express');
const learningController = require('../controllers/learningController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my-progress', learningController.getMyProgress);
router.get('/resources', learningController.getAllResources);
router.get('/topics/catalog', learningController.getTopicCatalog);
router.get('/topics/progress', learningController.getTopicProgress);
router.post('/topics/complete', learningController.completeTopic);
router.post('/topics/:topicId/complete', learningController.completeTopic);
router.get('/skills/:skillId/topics', learningController.getSkillTopics);
router.post('/skills/:skillId/topics', restrictTo('admin', 'manager'), learningController.createTopic);
router.post('/:resourceId/start', learningController.startResource);
router.put('/:resourceId/progress', learningController.updateProgress);
router.put('/progress/:resourceId', learningController.updateProgress);
router.post('/:resourceId/complete', learningController.completeResource);

module.exports = router;
