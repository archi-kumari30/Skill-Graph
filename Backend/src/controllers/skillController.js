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

const submitSkillVerification = catchAsync(async (req, res, next) => {
  const { proofUrl, notes } = req.body;
  const userSkill = await skillService.submitSkillVerification(
    req.user._id,
    req.params.skillId,
    proofUrl,
    notes
  );
  res.status(200).json({
    success: true,
    message: 'Verification proof submitted successfully and is pending review.',
    data: { userSkill }
  });
});

const getPendingVerifications = catchAsync(async (req, res, next) => {
  const verifications = await skillService.getPendingVerifications();
  res.status(200).json({
    success: true,
    data: { verifications }
  });
});

const reviewSkillVerification = catchAsync(async (req, res, next) => {
  const { decision, notes } = req.body;
  const userSkill = await skillService.reviewSkillVerification(
    req.params.id,
    req.user._id,
    decision,
    notes
  );
  res.status(200).json({
    success: true,
    message: `Skill verification ${decision} successfully.`,
    data: { userSkill }
  });
});

module.exports = {
  createSkill,
  getSkills,
  getSkill,
  updateSkill,
  deleteSkill,
  submitSkillVerification,
  getPendingVerifications,
  reviewSkillVerification
};
