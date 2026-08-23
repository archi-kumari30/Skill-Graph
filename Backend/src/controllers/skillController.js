const skillService = require('../services/skillService');
const { catchAsync } = require('../utils/helpers');

const createSkill = catchAsync(async (req, res, next) => {
  const skill = await skillService.createSkill(req.body, req.user);
  res.status(201).json({
    success: true,
    data: { skill }
  });
});

const getSkills = catchAsync(async (req, res, next) => {
  const { search, category } = req.query;
  const skills = await skillService.getAllSkills({ search, category }, req.user);
  res.status(200).json({
    success: true,
    data: { skills }
  });
});

const getSkill = catchAsync(async (req, res, next) => {
  const skill = await skillService.getSkillById(req.params.id);
  res.status(200).json({
    success: true,
    data: { skill }
  });
});

const updateSkill = catchAsync(async (req, res, next) => {
  const skill = await skillService.updateSkill(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: { skill }
  });
});

const deleteSkill = catchAsync(async (req, res, next) => {
  await skillService.deleteSkill(req.params.id);
  res.status(200).json({
    success: true,
    data: null
  });
});

module.exports = {
  createSkill,
  getSkills,
  getSkill,
  updateSkill,
  deleteSkill
};
