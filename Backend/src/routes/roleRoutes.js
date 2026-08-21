const express = require('express');
const roleController = require('../controllers/roleController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(roleController.getRoles)
  .post(restrictTo('admin', 'manager'), roleController.createRole);

router.route('/:id')
  .get(roleController.getRole)
  .put(restrictTo('admin', 'manager'), roleController.updateRole)
  .delete(restrictTo('admin'), roleController.deleteRole);

router.route('/:roleId/skills')
  .get(roleController.getRoleSkills)
  .post(restrictTo('admin', 'manager'), roleController.addRoleSkill);

router.route('/:roleId/skills/:skillId')
  .put(restrictTo('admin', 'manager'), roleController.updateRoleSkill)
  .delete(restrictTo('admin', 'manager'), roleController.deleteRoleSkill);

module.exports = router;
