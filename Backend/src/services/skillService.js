const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const SkillRelationship = require('../models/SkillRelationship');
const RoleSkill = require('../models/RoleSkill');
const LearningResource = require('../models/LearningResource');
const graphService = require('./graphService');
const { cascadeSkillDelete } = require('../utils/cascadeHelper');
const { NotFoundError, BadRequestError, ForbiddenError, ConflictError } = require('../utils/customErrors');

const createSkill = async (skillData, user) => {
  const { name, description, category, aliases, isPersonal } = skillData;
  if (!name || !category) {
    throw new BadRequestError('Skill name and category are required');
  }

  const userIsAdminOrManager = user && (user.accountRole === 'admin' || user.accountRole === 'manager');

  if (!userIsAdminOrManager && !isPersonal) {
    throw new ForbiddenError('You do not have permission to create global catalog skills');
  }

  const finalIsPersonal = !userIsAdminOrManager;
  const userId = finalIsPersonal ? user._id : null;

  const skill = await Skill.create({
    name,
    description,
    category,
    aliases,
    isPersonal: finalIsPersonal,
    userId
  });

  // Non-blocking real-time CognoDB / Neo4j node synchronization
  await graphService.upsertSkillNode(skill);

  return skill;
};

const getAllSkills = async (query = {}, user) => {
  const filter = {};

  if (query.category) {
    filter.category = { $regex: new RegExp('^' + query.category + '$', 'i') };
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [
      { name: searchRegex },
      { category: searchRegex },
      { aliases: searchRegex }
    ];
  }

  // Filter: return all global skills, plus personal skills belonging to this specific user
  if (user) {
    filter.$and = [
      {
        $or: [
          { isPersonal: { $ne: true } },
          { userId: user._id }
        ]
      }
    ];
  } else {
    filter.isPersonal = { $ne: true };
  }

  return await Skill.find(filter);
};

const getSkillById = async (id) => {
  const skill = await Skill.findById(id);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  return skill;
};

const updateSkill = async (id, updateData) => {
  const skill = await Skill.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  return skill;
};

const deleteSkill = async (id) => {
  const skill = await Skill.findByIdAndDelete(id);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }

  // Cascading cleanup across all referencing collections
  await cascadeSkillDelete(id);

  // Non-blocking real-time CognoDB / Neo4j node removal
  await graphService.removeSkillNode(id);

  return skill;
};

const submitSkillVerification = async (userId, skillId, proofUrl, notes = '') => {
  if (!proofUrl || (!proofUrl.startsWith('http://') && !proofUrl.startsWith('https://'))) {
    throw new BadRequestError('Please provide a valid web URL (e.g. GitHub repo, demo, or certificate)');
  }

  const userSkill = await UserSkill.findOne({ userId, skillId });
  if (!userSkill) {
    throw new NotFoundError('Skill not found in user inventory. Please add it first.');
  }

  if (userSkill.verificationStatus === 'verified') {
    throw new ConflictError('Skill is already verified');
  }

  userSkill.proofUrl = proofUrl.trim();
  userSkill.verificationStatus = 'pending';
  userSkill.verificationNotes = notes || '';
  await userSkill.save();

  return userSkill;
};

const getPendingVerifications = async (filter = {}) => {
  return await UserSkill.find({ verificationStatus: 'pending', ...filter })
    .populate('userId', 'name email college branch yearOfStudy accountRole')
    .populate('skillId', 'name category');
};

const reviewSkillVerification = async (userSkillId, reviewerId, decision, reviewerNotes = '') => {
  if (!['verified', 'rejected'].includes(decision)) {
    throw new BadRequestError("Decision must strictly be 'verified' or 'rejected'");
  }

  const userSkill = await UserSkill.findById(userSkillId);
  if (!userSkill) {
    throw new NotFoundError('Verification submission not found');
  }

  userSkill.verificationStatus = decision;
  userSkill.verified = decision === 'verified';
  userSkill.verifiedAt = new Date();
  userSkill.verifiedBy = reviewerId;
  if (reviewerNotes) {
    userSkill.verificationNotes = reviewerNotes;
  }
  await userSkill.save();

  return userSkill;
};

module.exports = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  submitSkillVerification,
  getPendingVerifications,
  reviewSkillVerification
};
