const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { ForbiddenError } = require('../utils/customErrors');

const router = express.Router();

// Middleware checking if the user is editing their own data, or is an admin/manager
const restrictToSelfOrAdminManager = (paramName) => {
  return (req, res, next) => {
    if (
      req.user.accountRole === 'admin' ||
      req.user.accountRole === 'manager' ||
      req.user._id.toString() === req.params[paramName]
    ) {
      return next();
    }
    return next(new ForbiddenError('You are not authorized to perform actions on this user profile'));
  };
};

router.use(protect);

router.route('/')
  .get(restrictTo('admin', 'manager'), userController.getUsers);

router.route('/:id')
  .get(restrictToSelfOrAdminManager('id'), userController.getUser)
  .put(restrictToSelfOrAdminManager('id'), userController.updateUser)
  .delete(restrictTo('admin'), userController.deleteUser);

router.route('/:userId/skills')
  .get(restrictToSelfOrAdminManager('userId'), userController.getUserSkills)
  .post(restrictToSelfOrAdminManager('userId'), userController.addUserSkill);

router.route('/:userId/skills/:skillId')
  .put(restrictToSelfOrAdminManager('userId'), userController.updateUserSkill)
  .delete(restrictToSelfOrAdminManager('userId'), userController.deleteUserSkill);

module.exports = router;
