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
    const userId = req.user.id;
    const { resourceId } = req.params;
    const { progressPercentage } = req.body;
    
    if (progressPercentage === undefined) {
      return res.status(400).json({
        success: false,
        error: { message: 'progressPercentage is required in request body' }
      });
    }

    const progress = await learningService.updateProgress(userId, resourceId, Number(progressPercentage));
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
    const userId = req.user.id;
    const { resourceId } = req.params;
    const progress = await learningService.completeResource(userId, resourceId);
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
    const userId = req.user.id;
    const { skillId, topicTitle, completed } = req.body;
    
    if (!skillId || !topicTitle) {
      return res.status(400).json({
        success: false,
        error: { message: 'skillId and topicTitle are required in request body' }
      });
    }

    const progress = await learningService.completeTopic(userId, skillId, topicTitle, completed);
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

module.exports = {
  startResource,
  updateProgress,
  completeResource,
  getMyProgress,
  getAllResources,
  getTopicProgress,
  completeTopic
};
