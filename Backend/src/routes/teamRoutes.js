const express = require('express');
const teamController = require('../controllers/teamController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin', 'manager'));

router.get('/skill-analysis', teamController.getTeamSkillAnalysis);
router.get('/role-readiness/:roleId', teamController.getTeamRoleReadiness);

module.exports = router;
