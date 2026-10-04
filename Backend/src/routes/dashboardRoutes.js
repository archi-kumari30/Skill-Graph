const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/summary', dashboardController.getSummary);
router.get('/command-center', dashboardController.getCommandCenter);

module.exports = router;
