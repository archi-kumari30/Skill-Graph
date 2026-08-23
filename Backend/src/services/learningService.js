const LearningProgress = require('../models/LearningProgress');
const LearningResource = require('../models/LearningResource');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');
const UserTopicProgress = require('../models/UserTopicProgress');
const graphService = require('./graphService');

const startResource = async (userId, resourceId) => {
  const resource = await LearningResource.findById(resourceId);
  if (!resource) {
    throw new NotFoundError('Learning resource not found');
  }

  if (process.env.USE_GRAPH_DB === 'true') {
    return await graphService.startLearningResource(userId, resourceId);
  }

  let progress = await LearningProgress.findOne({ userId, resourceId });
  if (progress) {
    return progress;
  }

  progress = await LearningProgress.create({
    userId,
    resourceId,
    status: 'in_progress',
    progressPercentage: 0,
    startedAt: new Date()
  });

  return progress;
};

const updateProgress = async (userId, resourceId, progressPercentage) => {
  if (process.env.USE_GRAPH_DB === 'true') {
    const progress = await graphService.updateLearningProgress(userId, resourceId, progressPercentage);
    if (!progress) {
      throw new NotFoundError('Learning progress record not found. Start the course first.');
    }
    return progress;
  }

  const progress = await LearningProgress.findOne({ userId, resourceId });
  if (!progress) {
    throw new NotFoundError('Learning progress record not found. Start the course first.');
  }

  progress.progressPercentage = Math.max(0, Math.min(100, progressPercentage));
  if (progress.progressPercentage === 100) {
    progress.status = 'completed';
    progress.completedAt = new Date();
  } else {
    progress.status = 'in_progress';
    progress.completedAt = undefined;
  }

  await progress.save();
  return progress;
};

const completeResource = async (userId, resourceId) => {
  if (process.env.USE_GRAPH_DB === 'true') {
    const progress = await graphService.completeLearningResource(userId, resourceId);
    if (!progress) {
      throw new NotFoundError('Learning resource not found');
    }
    return progress;
  }

  const progress = await LearningProgress.findOne({ userId, resourceId });
  if (!progress) {
    // If not started, auto-start and mark complete
    const resource = await LearningResource.findById(resourceId);
    if (!resource) {
      throw new NotFoundError('Learning resource not found');
    }
    const newProgress = await LearningProgress.create({
      userId,
      resourceId,
      status: 'completed',
      progressPercentage: 100,
      startedAt: new Date(),
      completedAt: new Date()
    });
    return newProgress;
  }

  progress.progressPercentage = 100;
  progress.status = 'completed';
  progress.completedAt = new Date();

  await progress.save();
  return progress;
};

const getMyProgress = async (userId) => {
  if (process.env.USE_GRAPH_DB === 'true') {
    return await graphService.getLearningProgress(userId);
  }

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
  if (process.env.USE_GRAPH_DB === 'true') {
    return await graphService.getTopicProgress(userId);
  }
  return await UserTopicProgress.find({ userId });
};

const completeTopic = async (userId, skillId, topicTitle, completed) => {
  if (process.env.USE_GRAPH_DB === 'true') {
    return await graphService.completeTopic(userId, skillId, topicTitle, completed);
  }

  if (completed) {
    return await UserTopicProgress.findOneAndUpdate(
      { userId, skillId, topicTitle },
      { completed: true },
      { upsert: true, new: true }
    );
  } else {
    return await UserTopicProgress.findOneAndDelete({ userId, skillId, topicTitle });
  }
};

module.exports = {
  startResource,
  updateProgress,
  completeResource,
  getMyProgress,
  getAllResources,
  getTopicProgress,
  completeTopic
};
