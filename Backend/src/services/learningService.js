const LearningProgress = require('../models/LearningProgress');
const LearningResource = require('../models/LearningResource');
const Topic = require('../models/Topic');
const Skill = require('../models/Skill');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const UserTopicProgress = require('../models/UserTopicProgress');
const graphService = require('./graphService');

const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const startResource = async (userId, resourceId) => {
  const resource = await LearningResource.findById(resourceId);
  if (!resource) {
    throw new NotFoundError('Learning resource not found');
  }

  let progress = await LearningProgress.findOne({ userId, resourceId });
  if (!progress) {
    progress = await LearningProgress.create({
      userId,
      resourceId,
      status: 'in_progress',
      progressPercentage: 0,
      startedAt: new Date()
    });
  }

  if (process.env.USE_GRAPH_DB === 'true') {
    try {
      await graphService.startLearningResource(userId, resourceId);
    } catch (err) {
      console.warn('CognoDB startResource sync warning:', err.message);
    }
  }

  return progress;
};

const updateProgress = async (userId, resourceId, progressPercentage, proofUrl) => {
  if (proofUrl !== undefined && proofUrl !== null && proofUrl !== '') {
    if (!isValidUrl(proofUrl)) {
      throw new BadRequestError('Invalid proofUrl format. Must be a valid HTTP or HTTPS URL.');
    }
  }

  let progress = await LearningProgress.findOne({ userId, resourceId });
  if (!progress) {
    const resource = await LearningResource.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Learning resource not found');
    }
    progress = await LearningProgress.create({
      userId,
      resourceId,
      status: 'in_progress',
      progressPercentage: 0,
      startedAt: new Date()
    });
  }

  if (proofUrl !== undefined && proofUrl !== null && proofUrl !== '') {
    progress.proofUrl = proofUrl.trim();
  }

  if (progressPercentage !== undefined && progressPercentage !== null) {
    progress.progressPercentage = Math.max(0, Math.min(100, Number(progressPercentage)));
    if (progress.progressPercentage === 100) {
      progress.status = 'completed';
      progress.completedAt = new Date();
    } else {
      progress.status = 'in_progress';
      progress.completedAt = undefined;
    }
  }

  await progress.save();

  if (process.env.USE_GRAPH_DB === 'true') {
    try {
      await graphService.updateLearningProgress(userId, resourceId, progress.progressPercentage);
    } catch (err) {
      console.warn('CognoDB updateLearningProgress sync warning:', err.message);
    }
  }

  return progress;
};

const completeResource = async (userId, resourceId, proofUrl) => {
  if (proofUrl !== undefined && proofUrl !== null && proofUrl !== '') {
    if (!isValidUrl(proofUrl)) {
      throw new BadRequestError('Invalid proofUrl format. Must be a valid HTTP or HTTPS URL.');
    }
  }

  let progress = await LearningProgress.findOne({ userId, resourceId });
  if (!progress) {
    const resource = await LearningResource.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Learning resource not found');
    }
    progress = await LearningProgress.create({
      userId,
      resourceId,
      status: 'completed',
      progressPercentage: 100,
      startedAt: new Date(),
      completedAt: new Date(),
      proofUrl: proofUrl ? proofUrl.trim() : ''
    });
  } else {
    progress.progressPercentage = 100;
    progress.status = 'completed';
    progress.completedAt = new Date();
    if (proofUrl) {
      progress.proofUrl = proofUrl.trim();
    }
    await progress.save();
  }

  if (process.env.USE_GRAPH_DB === 'true') {
    try {
      await graphService.completeLearningResource(userId, resourceId);
    } catch (err) {
      console.warn('CognoDB completeLearningResource sync warning:', err.message);
    }
  }

  return progress;
};

const getMyProgress = async (userId) => {
  const progressList = await LearningProgress.find({ userId })
    .populate({
      path: 'resourceId',
      populate: {
        path: 'skillId',
        select: 'name category'
      }
    });

  return progressList;
};

const getAllResources = async () => {
  return await LearningResource.find().populate('skillId');
};

const getTopicProgress = async (userId) => {
  return await UserTopicProgress.find({ userId });
};

const completeTopic = async (userId, skillId, topicTitle, completed) => {
  let progress;
  if (completed) {
    progress = await UserTopicProgress.findOneAndUpdate(
      { userId, skillId, topicTitle },
      { completed: true },
      { upsert: true, new: true }
    );
  } else {
    progress = await UserTopicProgress.findOneAndDelete({ userId, skillId, topicTitle });
  }

  if (process.env.USE_GRAPH_DB === 'true') {
    try {
      await graphService.completeTopic(userId, skillId, topicTitle, completed);
    } catch (err) {
      console.warn('CognoDB completeTopic sync warning:', err.message);
    }
  }

  return progress;
};

const getTopicCatalog = async (skillId) => {
  const filter = {};
  if (skillId) {
    filter.skillId = skillId;
  }
  return await Topic.find(filter).populate('skillId', 'name category').sort({ order: 1 });
};

const getSkillTopics = async (skillId) => {
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  return await Topic.find({ skillId }).sort({ order: 1 });
};

const createTopic = async (skillId, topicData) => {
  const skill = await Skill.findById(skillId);
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }

  const { title, slug, order, summary } = topicData;
  if (!title || !slug) {
    throw new BadRequestError('Topic title and slug are required');
  }

  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(slug.trim())) {
    throw new BadRequestError('Slug must contain only lowercase alphanumeric characters and hyphens');
  }

  const existing = await Topic.findOne({ skillId, slug: slug.trim().toLowerCase() });
  if (existing) {
    throw new BadRequestError('Topic with this slug already exists for this skill');
  }

  const topic = await Topic.create({
    skillId,
    title: title.trim(),
    slug: slug.trim().toLowerCase(),
    order: order !== undefined ? Number(order) : 0,
    summary: summary ? summary.trim() : ''
  });

  return topic;
};

module.exports = {
  startResource,
  updateProgress,
  completeResource,
  getMyProgress,
  getAllResources,
  getTopicProgress,
  completeTopic,
  getTopicCatalog,
  getSkillTopics,
  createTopic
};
