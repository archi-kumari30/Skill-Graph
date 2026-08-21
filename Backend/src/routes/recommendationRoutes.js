const express = require('express');
const recommendationController = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');
const { ForbiddenError } = require('../utils/customErrors');

const router = express.Router();

const restrictToSelfOrAdminManager = (paramName) => {
  return (req, res, next) => {
    if (
      req.user.accountRole === 'admin' ||
      req.user.accountRole === 'manager' ||
      req.user._id.toString() === req.params[paramName]
    ) {
      return next();
    }
    return next(new ForbiddenError('You are not authorized to view recommendations for this user'));
  };
};

router.use(protect);

router.get('/users/:userId/roles/:roleId', restrictToSelfOrAdminManager('userId'), recommendationController.getRecommendations);

module.exports = router;
