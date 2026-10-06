const express = require('express');
const collegeController = require('../controllers/collegeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public/authenticated access to view colleges (for students during onboarding/registration & admin)
router.get('/', collegeController.getColleges);
router.get('/:id', collegeController.getCollege);

// Admin-only management endpoints
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', collegeController.createCollege);
router.patch('/:id/status', collegeController.updateCollegeStatus);
router.delete('/:id', collegeController.deleteCollege);

module.exports = router;
