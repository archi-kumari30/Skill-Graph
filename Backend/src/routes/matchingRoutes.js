const express = require('express');
const matchingController = require('../controllers/matchingController');
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
    return next(new ForbiddenError('You are not authorized to view role matches for this user'));
  };
};

router.use(protect);

router.get('/users/:userId/roles', restrictToSelfOrAdminManager('userId'), matchingController.getRoleMatches);

module.exports = router;
