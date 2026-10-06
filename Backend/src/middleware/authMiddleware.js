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

    const currentUser = await User.findById(decoded.id).populate('targetRoleId');
    if (!currentUser) {
      return next(new UnauthorizedError('The user belonging to this token no longer exists.'));
    }

    if (currentUser.isActive === false) {
      return next(new ForbiddenError('Your account has been deactivated. Please contact the administrator.'));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

const restrictTo = (...roles) => {
  const normalizedAllowedRoles = new Set(roles);
  if (roles.includes('recruiter') || roles.includes('manager')) {
    normalizedAllowedRoles.add('recruiter');
    normalizedAllowedRoles.add('manager');
  }
  if (roles.includes('student') || roles.includes('employee')) {
    normalizedAllowedRoles.add('student');
    normalizedAllowedRoles.add('employee');
  }

  return (req, res, next) => {
    if (!req.user || !normalizedAllowedRoles.has(req.user.accountRole)) {
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
