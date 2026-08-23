const express = require('express');
const jobController = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/matches', jobController.getJobMatches);

module.exports = router;
