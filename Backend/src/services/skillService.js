const Skill = require('../models/Skill');
const UserSkill = require('../models/UserSkill');
const SkillRelationship = require('../models/SkillRelationship');
const RoleSkill = require('../models/RoleSkill');
const LearningResource = require('../models/LearningResource');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');

const createSkill = async (skillData) => {
  const { name, description, category, aliases } = skillData;
  if (!name || !category) {
    throw new BadRequestError('Skill name and category are required');
  }
  return await Skill.create({ name, description, category, aliases });
};

const getAllSkills = async (query = {}) => {
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

  // Cascade delete all references to this skill
  await UserSkill.deleteMany({ skillId: id });
  await SkillRelationship.deleteMany({
    $or: [{ sourceSkillId: id }, { targetSkillId: id }]
  });
  await RoleSkill.deleteMany({ skillId: id });
  await LearningResource.deleteMany({ skillId: id });

  return skill;
};

module.exports = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill
};
