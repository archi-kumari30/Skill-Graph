const express = require('express');
const skillController = require('../controllers/skillController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(skillController.getSkills)
  .post(restrictTo('admin', 'manager'), skillController.createSkill);

router.route('/:id')
  .get(skillController.getSkill)
  .put(restrictTo('admin', 'manager'), skillController.updateSkill)
  .delete(restrictTo('admin'), skillController.deleteSkill);

module.exports = router;
