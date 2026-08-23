const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Skill = require('../models/Skill');
const graphService = require('./graphService');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/customErrors');

const getAllUsers = async (filter = {}) => {
  return await User.find(filter);
};

const getUserById = async (id) => {
  const user = await User.findById(id).populate('targetRoleId');
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
  await getUserById(userId);

  if (process.env.USE_GRAPH_DB === 'true') {
    const mongoUserSkills = await UserSkill.find({ userId }).populate('skillId');
    const graphUserSkills = await graphService.getUserSkills(userId);

    if (mongoUserSkills.length !== graphUserSkills.length) {
      await graphService.runQuery(
        'MATCH (u:User { id: $userId })-[r:HAS_SKILL]->() DELETE r',
        { userId }
      );
      for (const us of mongoUserSkills) {
        if (us.skillId) {
          await graphService.addUserSkill(
            userId,
            us.skillId._id.toString(),
            us.proficiency,
            us.yearsOfExperience || 0
          );
        }
      }
      return await graphService.getUserSkills(userId);
    }
    return graphUserSkills;
  }

  return await UserSkill.find({ userId }).populate('skillId');
};

const addUserSkill = async (userId, skillData) => {
  const { skillId, proficiency, yearsOfExperience, source } = skillData;

  if (!skillId) {
    throw new BadRequestError('Skill ID is required');
  }

  await getUserById(userId);
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }

  const existing = await UserSkill.findOne({ userId, skillId });
  if (existing) {
    throw new ConflictError('User already has this skill in their profile. Use PUT to update.');
  }

  let userSkill;
  if (process.env.USE_GRAPH_DB === 'true') {
    const res = await graphService.addUserSkill(userId, skillId, proficiency, yearsOfExperience || 0);
    userSkill = {
      _id: `${userId}_${skillId}`,
      userId,
      skillId: {
        _id: skillId,
        name: skill.name,
        category: skill.category
      },
      proficiency: res.proficiency,
      yearsOfExperience: res.yearsOfExperience,
      source: source || 'self'
    };
    await UserSkill.create({
      userId,
      skillId,
      proficiency,
      yearsOfExperience,
      source: source || 'self'
    });
  } else {
    userSkill = await UserSkill.create({
      userId,
      skillId,
      proficiency,
      yearsOfExperience,
      source: source || 'self'
    });
  }
  return userSkill;
};

const updateUserSkill = async (userId, skillId, updateData) => {
  await getUserById(userId);

  let userSkill;
  if (process.env.USE_GRAPH_DB === 'true') {
    const res = await graphService.updateUserSkill(userId, skillId, updateData);
    if (!res) {
      throw new NotFoundError('Skill not found on this user profile');
    }

    const skill = await Skill.findById(skillId);
    userSkill = {
      _id: `${userId}_${skillId}`,
      userId,
      skillId: {
        _id: skillId,
        name: skill ? skill.name : '',
        category: skill ? skill.category : ''
      },
      proficiency: res.proficiency,
      yearsOfExperience: res.yearsOfExperience
    };
    await UserSkill.findOneAndUpdate({ userId, skillId }, updateData);
  } else {
    userSkill = await UserSkill.findOneAndUpdate(
      { userId, skillId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!userSkill) {
      throw new NotFoundError('Skill not found on this user profile');
    }
  }

  return userSkill;
};

const deleteUserSkill = async (userId, skillId) => {
  await getUserById(userId);

  let result;
  if (process.env.USE_GRAPH_DB === 'true') {
    const deleted = await graphService.deleteUserSkill(userId, skillId);
    if (!deleted) {
      throw new NotFoundError('Skill not found on this user profile');
    }
    result = await UserSkill.findOneAndDelete({ userId, skillId });
  } else {
    result = await UserSkill.findOneAndDelete({ userId, skillId });
    if (!result) {
      throw new NotFoundError('Skill not found on this user profile');
    }
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
