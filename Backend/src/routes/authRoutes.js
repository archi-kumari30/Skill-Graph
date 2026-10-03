const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const { validate } = require('../middleware/validate');

const registerSchema = {
  body: {
    name: { required: true, minLength: 2 },
    email: { required: true, pattern: /^\S+@\S+\.\S+$/, patternMessage: 'Invalid email address' },
    password: { required: true, minLength: 6 }
  }
};

const loginSchema = {
  body: {
    email: { required: true, pattern: /^\S+@\S+\.\S+$/, patternMessage: 'Invalid email address' },
    password: { required: true }
  }
};

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', protect, authController.me);

module.exports = router;
