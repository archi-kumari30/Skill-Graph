const roleService = require('../services/roleService');
const { catchAsync } = require('../utils/helpers');

const createRole = catchAsync(async (req, res, next) => {
  const role = await roleService.createRole(req.body);
  res.status(201).json({
    success: true,
    data: { role }
  });
});

const getRoles = catchAsync(async (req, res, next) => {
  const roles = await roleService.getAllRoles();
  res.status(200).json({
    success: true,
    data: { roles }
  });
});

const getRole = catchAsync(async (req, res, next) => {
  const role = await roleService.getRoleById(req.params.id);
  res.status(200).json({
    success: true,
    data: { role }
  });
});

const updateRole = catchAsync(async (req, res, next) => {
  const role = await roleService.updateRole(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: { role }
  });
});

const deleteRole = catchAsync(async (req, res, next) => {
  await roleService.deleteRole(req.params.id);
  res.status(200).json({
    success: true,
    data: null
  });
});

// Role Skills mappings
const getRoleSkills = catchAsync(async (req, res, next) => {
  const skills = await roleService.getRoleSkills(req.params.roleId);
  res.status(200).json({
    success: true,
    data: { skills }
  });
});

const addRoleSkill = catchAsync(async (req, res, next) => {
  const roleSkill = await roleService.addRoleSkill(req.params.roleId, req.body);
  res.status(201).json({
    success: true,
    data: { roleSkill }
  });
});

const updateRoleSkill = catchAsync(async (req, res, next) => {
  const roleSkill = await roleService.updateRoleSkill(req.params.roleId, req.params.skillId, req.body);
  res.status(200).json({
    success: true,
    data: { roleSkill }
  });
});

const deleteRoleSkill = catchAsync(async (req, res, next) => {
  await roleService.deleteRoleSkill(req.params.roleId, req.params.skillId);
  res.status(200).json({
    success: true,
    data: null
  });
});

module.exports = {
  createRole,
  getRoles,
  getRole,
  updateRole,
  deleteRole,
  getRoleSkills,
  addRoleSkill,
  updateRoleSkill,
  deleteRoleSkill
};
