const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Skill = require('../models/Skill');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/customErrors');

const getAllUsers = async (filter = {}) => {
  return await User.find(filter);
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

const updateUser = async (id, updateData) => {
  // Prevent password update from this endpoint to ensure bcrypt pre-save runs (auth handles password resetting if needed)
  if (updateData.password) {
    delete updateData.password;
  }

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  // Cascade delete user skills
  await UserSkill.deleteMany({ userId: id });
  return user;
};

// User Skill Management
const getUserSkills = async (userId) => {
  // Check user exists
  await getUserById(userId);

  return await UserSkill.find({ userId }).populate('skillId');
};

const addUserSkill = async (userId, skillData) => {
  const { skillId, proficiency, yearsOfExperience, source } = skillData;

  if (!skillId) {
    throw new BadRequestError('Skill ID is required');
  }

  // Verify User and Skill exist
  await getUserById(userId);
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }

  // Check if relationship already exists
  const existing = await UserSkill.findOne({ userId, skillId });
  if (existing) {
    throw new ConflictError('User already has this skill in their profile. Use PUT to update.');
  }

  return await UserSkill.create({
    userId,
    skillId,
    proficiency,
    yearsOfExperience,
    source: source || 'self'
  });
};

const updateUserSkill = async (userId, skillId, updateData) => {
  // Verify User exists
  await getUserById(userId);

  const userSkill = await UserSkill.findOneAndUpdate(
    { userId, skillId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!userSkill) {
    throw new NotFoundError('Skill not found on this user profile');
  }

  return userSkill;
};

const deleteUserSkill = async (userId, skillId) => {
  // Verify User exists
  await getUserById(userId);

  const result = await UserSkill.findOneAndDelete({ userId, skillId });
  if (!result) {
    throw new NotFoundError('Skill not found on this user profile');
  }

  return result;
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill
};
