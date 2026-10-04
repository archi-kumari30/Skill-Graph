const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Skill = require('../models/Skill');
const Role = require('../models/Role');
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

  const { getDriver } = require('../config/cognodb');
  const isGraphDbConnected = process.env.USE_GRAPH_DB === 'true' && Boolean(getDriver && getDriver());

  if (isGraphDbConnected) {
    try {
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
    } catch (err) {
      console.warn('[COGNODB RESILIENCE] Falling back to MongoDB for getUserSkills:', err.message);
    }
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
  const { getDriver } = require('../config/cognodb');
  const isGraphDbConnected = process.env.USE_GRAPH_DB === 'true' && Boolean(getDriver && getDriver());

  if (isGraphDbConnected) {
    try {
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
    } catch (err) {
      console.warn('[COGNODB RESILIENCE] Falling back to MongoDB for addUserSkill:', err.message);
    }
  }

  if (!userSkill) {
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

  const { getDriver } = require('../config/cognodb');
  const isGraphDbConnected = process.env.USE_GRAPH_DB === 'true' && Boolean(getDriver && getDriver());

  let userSkill;
  if (isGraphDbConnected) {
    try {
      const res = await graphService.updateUserSkill(userId, skillId, updateData);
      if (res) {
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
      }
    } catch (err) {
      console.warn('[COGNODB RESILIENCE] Falling back to MongoDB for updateUserSkill:', err.message);
    }
  }

  if (!userSkill) {
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

  const { getDriver } = require('../config/cognodb');
  const isGraphDbConnected = process.env.USE_GRAPH_DB === 'true' && Boolean(getDriver && getDriver());

  if (isGraphDbConnected) {
    try {
      await graphService.deleteUserSkill(userId, skillId);
    } catch (err) {
      console.warn('[COGNODB RESILIENCE] Falling back to MongoDB for deleteUserSkill:', err.message);
    }
  }

  const result = await UserSkill.findOneAndDelete({ userId, skillId });
  if (!result) {
    throw new NotFoundError('Skill not found on this user profile');
  }

  return result;
};

const saveTargetRole = async (userId, roleId, action = 'add') => {
  if (!roleId) {
    throw new BadRequestError('Role ID is required');
  }

  const role = await Role.findById(roleId);
  if (!role) {
    throw new NotFoundError('Target role not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.savedRoleIds) {
    user.savedRoleIds = [];
  }

  const roleIdStr = roleId.toString();
  if (action === 'remove') {
    user.savedRoleIds = user.savedRoleIds.filter(
      (id) => id.toString() !== roleIdStr
    );
  } else {
    // Add if not already saved
    const alreadySaved = user.savedRoleIds.some(
      (id) => id.toString() === roleIdStr
    );
    if (!alreadySaved) {
      user.savedRoleIds.push(roleId);
    }
  }

  await user.save();
  return await User.findById(userId).populate('targetRoleId').populate('savedRoleIds');
};

const completeOnboarding = async (userId, onboardingData) => {
  const { targetRoleId, experienceLevel, weeklyStudyHours, primaryFocus, skills } = onboardingData;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (targetRoleId) {
    const role = await Role.findById(targetRoleId);
    if (role) {
      user.targetRoleId = role._id;
      if (!user.savedRoleIds) user.savedRoleIds = [];
      const alreadySaved = user.savedRoleIds.some(id => id.toString() === role._id.toString());
      if (!alreadySaved) {
        user.savedRoleIds.push(role._id);
      }
    }
  }

  if (experienceLevel) user.experienceLevel = experienceLevel;
  if (weeklyStudyHours) user.weeklyStudyHours = Number(weeklyStudyHours);
  if (primaryFocus) user.primaryFocus = primaryFocus;
  user.onboardingCompleted = true;
  await user.save();

  // If skills provided: array of { skillId, proficiency }
  if (skills && Array.isArray(skills)) {
    for (const s of skills) {
      const sId = s.skillId || s.id;
      if (!sId) continue;
      const skill = await Skill.findById(sId);
      if (!skill) continue;

      const prof = s.proficiency ? Number(s.proficiency) : 2;
      const existing = await UserSkill.findOne({ userId, skillId: sId });
      if (existing) {
        existing.proficiency = prof;
        await existing.save();
      } else {
        await UserSkill.create({
          userId,
          skillId: sId,
          proficiency: prof,
          source: 'onboarding'
        });
      }
    }
  }

  // Log DailyActivity
  try {
    const DailyActivity = require('../models/DailyActivity');
    const today = new Date().toISOString().split('T')[0];
    await DailyActivity.create({
      userId,
      date: today,
      activityType: 'skill_added',
      title: 'Completed Career Onboarding',
      details: 'Configured target role and starting skills',
      minutesSpent: 20
    });
  } catch (err) {
    console.warn('Could not log onboarding activity:', err.message);
  }

  return await User.findById(userId).populate('targetRoleId').populate('savedRoleIds');
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserSkills,
  addUserSkill,
  updateUserSkill,
  deleteUserSkill,
  saveTargetRole,
  completeOnboarding
};

