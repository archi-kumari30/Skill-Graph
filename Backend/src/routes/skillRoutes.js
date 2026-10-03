const express = require('express');
const skillController = require('../controllers/skillController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(skillController.getSkills)
  .post(skillController.createSkill);

// Skill Verification Pipeline
router.post('/my-skills/:skillId/verify', skillController.submitSkillVerification);
router.get('/verifications/pending', restrictTo('admin', 'manager'), skillController.getPendingVerifications);
router.put('/verifications/:id/review', restrictTo('admin', 'manager'), skillController.reviewSkillVerification);

router.route('/:id')
  .get(skillController.getSkill)
  .put(restrictTo('admin', 'manager'), skillController.updateSkill)
  .delete(restrictTo('admin'), skillController.deleteSkill);

module.exports = router;
