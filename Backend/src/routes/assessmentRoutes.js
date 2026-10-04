const express = require('express');
const assessmentController = require('../controllers/assessmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Allow reading assessments without login or with login
router.get('/', (req, res, next) => {
  // Try optional auth to populate req.user if cookie/token present
  const jwt = require('jsonwebtoken');
  const config = require('../config/config');
  const User = require('../models/User');

  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      User.findById(decoded.id).then(user => {
        if (user) req.user = user;
        next();
      }).catch(() => next());
    } catch (err) {
      next();
    }
  } else {
    next();
  }
}, assessmentController.getAllAssessments);

router.get('/my/attempts', protect, assessmentController.getMyAttempts);
router.get('/:id', assessmentController.getAssessmentById);
router.post('/:id/submit', protect, assessmentController.submitAssessment);

module.exports = router;
