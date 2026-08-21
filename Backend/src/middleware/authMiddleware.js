const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const { UnauthorizedError, ForbiddenError } = require('../utils/customErrors');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new UnauthorizedError('You are not logged in! Please log in to get access.'));
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.accountRole)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action')
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
