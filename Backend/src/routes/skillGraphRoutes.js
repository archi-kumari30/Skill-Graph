const express = require('express');
const skillGraphController = require('../controllers/skillGraphController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(skillGraphController.getGraph);

router.route('/relationships')
  .get(skillGraphController.getRelationships)
  .post(restrictTo('admin', 'manager'), skillGraphController.createRelationship);

router.route('/relationships/:id')
  .delete(restrictTo('admin', 'manager'), skillGraphController.deleteRelationship);

router.route('/skills/:skillId/related')
  .get(skillGraphController.getRelatedSkills);

module.exports = router;
