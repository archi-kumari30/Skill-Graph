const learningService = require('../services/learningService');

const startResource = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { resourceId } = req.params;
    const progress = await learningService.startResource(userId, resourceId);
    res.status(201).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateProgress = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { resourceId } = req.params;
    const { progressPercentage, proofUrl } = req.body;
    
    if (progressPercentage === undefined && proofUrl === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'progressPercentage or proofUrl is required in request body' }
      });
    }

    const progress = await learningService.updateProgress(userId, resourceId, progressPercentage, proofUrl);
    res.status(200).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

const completeResource = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { resourceId } = req.params;
    const { proofUrl } = req.body || {};
    const progress = await learningService.completeResource(userId, resourceId, proofUrl);
    res.status(200).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMyProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const progress = await learningService.getMyProgress(userId);
    res.status(200).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllResources = async (req, res, next) => {
  try {
    const resources = await learningService.getAllResources();
    res.status(200).json({
      success: true,
      data: {
        resources
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTopicProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const completedTopics = await learningService.getTopicProgress(userId);
    res.status(200).json({
      success: true,
      data: {
        completedTopics
      }
    });
  } catch (error) {
    next(error);
  }
};

const completeTopic = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    let { skillId, topicTitle, completed } = req.body || {};
    
    // Support topic completion by topicId (used by Dashboard Command Center)
    const topicIdParam = req.params?.topicId || req.body?.topicId;
    if ((!skillId || !topicTitle) && topicIdParam) {
      const Topic = require('../models/Topic');
      const foundTopic = await Topic.findById(topicIdParam);
      if (foundTopic) {
        skillId = foundTopic.skillId;
        topicTitle = foundTopic.title;
      }
    }

    if (!skillId || !topicTitle) {
      return res.status(400).json({
        success: false,
        error: { message: 'skillId and topicTitle are required in request body' }
      });
    }

    const progress = await learningService.completeTopic(userId, skillId, topicTitle, completed !== false);
    res.status(200).json({
      success: true,
      data: {
        progress
      }
    });
  } catch (error) {
    next(error);
  }
};

const getTopicCatalog = async (req, res, next) => {
  try {
    const { skillId } = req.query;
    const topics = await learningService.getTopicCatalog(skillId);
    res.status(200).json({
      success: true,
      data: {
        topics
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSkillTopics = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const topics = await learningService.getSkillTopics(skillId);
    res.status(200).json({
      success: true,
      data: {
        topics
      }
    });
  } catch (error) {
    next(error);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const topic = await learningService.createTopic(skillId, req.body);
    res.status(201).json({
      success: true,
      data: {
        topic
      }
    });
  } catch (error) {
    next(error);
  }
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
