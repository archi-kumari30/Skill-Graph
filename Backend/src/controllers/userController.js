const userService = require('../services/userService');
const { catchAsync } = require('../utils/helpers');

const getUsers = catchAsync(async (req, res, next) => {
  const users = await userService.getAllUsers();
  res.status(200).json({
    success: true,
    data: { users }
  });
});

const getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({
    success: true,
    data: { user }
  });
});

const updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: { user }
  });
});

const deleteUser = catchAsync(async (req, res, next) => {
  await userService.deleteUser(req.params.id);
  res.status(200).json({
    success: true,
    data: null
  });
});

// User Skill profiles
const getUserSkills = catchAsync(async (req, res, next) => {
  const skills = await userService.getUserSkills(req.params.userId);
  res.status(200).json({
    success: true,
    data: { skills }
  });
});

const addUserSkill = catchAsync(async (req, res, next) => {
  const userSkill = await userService.addUserSkill(req.params.userId, req.body);
  res.status(201).json({
    success: true,
    data: { userSkill }
  });
});

const updateUserSkill = catchAsync(async (req, res, next) => {
  const userSkill = await userService.updateUserSkill(req.params.userId, req.params.skillId, req.body);
  res.status(200).json({
    success: true,
    data: { userSkill }
  });
});

const deleteUserSkill = catchAsync(async (req, res, next) => {
  await userService.deleteUserSkill(req.params.userId, req.params.skillId);
  res.status(200).json({
    success: true,
    data: null
  });
});

module.exports = {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill
};
