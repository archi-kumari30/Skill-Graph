const Role = require('../models/Role');
const RoleSkill = require('../models/RoleSkill');
const Skill = require('../models/Skill');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/customErrors');

const createRole = async (roleData) => {
  const { name, description, department, level } = roleData;
  if (!name) {
    throw new BadRequestError('Role name is required');
  }
  return await Role.create({ name, description, department, level });
};

const getAllRoles = async (filter = {}) => {
  return await Role.find(filter);
};

const getRoleById = async (id) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new NotFoundError('Role not found');
  }
  return role;
};

const updateRole = async (id, updateData) => {
  const role = await Role.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
  if (!role) {
    throw new NotFoundError('Role not found');
  }
  return role;
};

const deleteRole = async (id) => {
  const role = await Role.findByIdAndDelete(id);
  if (!role) {
    throw new NotFoundError('Role not found');
  }
  // Cascade delete role skills
  await RoleSkill.deleteMany({ roleId: id });
  return role;
};

// Role Skill Requirements
const getRoleSkills = async (roleId) => {
  await getRoleById(roleId);
  if (process.env.USE_GRAPH_DB === 'true') {
    const graphService = require('./graphService');
    return await graphService.getCareerRequirements(roleId);
  }
  return await RoleSkill.find({ roleId }).populate('skillId');
};

const addRoleSkill = async (roleId, skillRequirement) => {
  const { skillId, requiredProficiency, importance } = skillRequirement;

  if (!skillId || !requiredProficiency || !importance) {
    throw new BadRequestError('Skill ID, required proficiency, and importance are required');
  }

  // Verify Role and Skill exist
  await getRoleById(roleId);
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }

  // Check if requirement already exists
  const existing = await RoleSkill.findOne({ roleId, skillId });
  if (existing) {
    throw new ConflictError('Role already has a requirement for this skill. Use PUT to update.');
  }

  return await RoleSkill.create({
    roleId,
    skillId,
    requiredProficiency,
    importance
  });
};

const updateRoleSkill = async (roleId, skillId, updateData) => {
  await getRoleById(roleId);

  const roleSkill = await RoleSkill.findOneAndUpdate(
    { roleId, skillId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!roleSkill) {
    throw new NotFoundError('Skill requirement not found for this role');
  }

  return roleSkill;
};

const deleteRoleSkill = async (roleId, skillId) => {
  await getRoleById(roleId);

  const result = await RoleSkill.findOneAndDelete({ roleId, skillId });
  if (!result) {
    throw new NotFoundError('Skill requirement not found for this role');
  }

  return result;
};

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getRoleSkills,
  addRoleSkill,
  updateRoleSkill,
  deleteRoleSkill
};
