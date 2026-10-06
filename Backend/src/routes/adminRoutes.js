const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', adminController.getPlatformStats);
router.get('/students', adminController.getStudentsList);
router.get('/students/:id', adminController.getStudentDetails);
router.get('/recruiters', adminController.getRecruitersList);
router.patch('/users/:id/status', adminController.toggleUserStatus);

module.exports = router;
