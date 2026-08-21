const skillGraphService = require('../services/skillGraphService');
const { catchAsync } = require('../utils/helpers');

const createRelationship = catchAsync(async (req, res, next) => {
  const relationship = await skillGraphService.createRelationship(req.body);
  res.status(201).json({
    success: true,
    data: { relationship }
  });
});

const getRelationships = catchAsync(async (req, res, next) => {
  const relationships = await skillGraphService.getAllRelationships();
  res.status(200).json({
    success: true,
    data: { relationships }
  });
});

const getRelatedSkills = catchAsync(async (req, res, next) => {
  const relatedSkills = await skillGraphService.getRelatedSkills(req.params.skillId);
  res.status(200).json({
    success: true,
    data: { relatedSkills }
  });
});

const deleteRelationship = catchAsync(async (req, res, next) => {
  await skillGraphService.deleteRelationship(req.params.id);
  res.status(200).json({
    success: true,
    data: null
  });
});

const getGraph = catchAsync(async (req, res, next) => {
  const graph = await skillGraphService.getGraph();
  res.status(200).json({
    success: true,
    data: graph
  });
});

module.exports = {
  createRelationship,
  getRelationships,
  getRelatedSkills,
  deleteRelationship,
  getGraph
};
