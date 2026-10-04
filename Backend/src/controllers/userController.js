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

const getProfile = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.user._id);
  res.status(200).json({
    success: true,
    data: { user }
  });
});

const updateProfile = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.user._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

const saveTargetRole = catchAsync(async (req, res, next) => {
  const { roleId, action } = req.body;
  const user = await userService.saveTargetRole(req.user._id, roleId, action);
  res.status(200).json({
    success: true,
    message: `Target role ${action === 'remove' ? 'removed from' : 'saved to'} profile successfully`,
    data: { user }
  });
});

const completeOnboarding = catchAsync(async (req, res, next) => {
  const user = await userService.completeOnboarding(req.user._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Onboarding completed successfully',
    data: { user }
  });
});

const getProfileOverview = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.user._id);
  const skills = await userService.getUserSkills(req.user._id);
  const Project = require('../models/Project');
  const projects = await Project.find({ userId: req.user._id }).populate('skillsUsed');

  let readiness = null;
  if (user.targetRoleId) {
    try {
      const skillGapService = require('../services/skillGapService');
      readiness = await skillGapService.calculateGap(user._id, user.targetRoleId._id);
    } catch (err) {
      // Ignore if calculation not possible
    }
  }

  res.status(200).json({
    success: true,
    data: {
      user,
      skills,
      projects,
      readiness
    }
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
  deleteUserSkill,
  getProfile,
  updateProfile,
  saveTargetRole,
  completeOnboarding,
  getProfileOverview
};

