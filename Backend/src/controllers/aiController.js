const aiService = require('../services/aiService');
const { catchAsync } = require('../utils/helpers');
const { BadRequestError } = require('../utils/customErrors');

const streamChat = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { message, question } = req.body;
    const userPrompt = message || question;

    if (!userPrompt || !userPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message cannot be empty' }
      });
    }

    if (userPrompt.length > 2000) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message exceeds maximum limit of 2000 characters' }
      });
    }

    await aiService.streamChatResponse(userId, userPrompt.trim(), res);
  } catch (error) {
    next(error);
  }
};

const chat = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const { message, question, history } = req.body;
  const userPrompt = message || question;

  if (!userPrompt || !userPrompt.trim()) {
    return res.status(400).json({
      success: false,
      error: { message: 'Message cannot be empty' }
    });
  }

  if (userPrompt.length > 2000) {
    return res.status(400).json({
      success: false,
      error: { message: 'Message exceeds maximum limit of 2000 characters' }
    });
  }

  const result = await aiService.getCareerGuidance(userId, userPrompt.trim(), history);
  res.status(200).json({
    success: true,
    data: result
  });
});

const getCareerGuidance = catchAsync(async (req, res, next) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.startsWith('YOUR_')) {
    throw new BadRequestError('AI Career Assistant is not configured. Missing GEMINI_API_KEY in backend environment.');
  }

  const userId = req.user.id || req.user._id;
  const { question, message, history } = req.body;
  const userPrompt = question || message;

  if (!userPrompt || !userPrompt.trim()) {
    return res.status(400).json({
      success: false,
      error: { message: 'question is required in request body' }
    });
  }

  const result = await aiService.getCareerGuidance(userId, userPrompt.trim(), history);
  res.status(200).json({
    success: true,
    data: {
      response: result.response || result.reply
    }
  });
});

const getChatHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const messages = await aiService.getChatHistory(userId);
  res.status(200).json({
    success: true,
    data: { messages }
  });
});

const clearChatHistory = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  await aiService.clearChatHistory(userId);
  res.status(200).json({
    success: true,
    message: 'Chat history cleared successfully'
  });
});

const getAIStatus = async (req, res, next) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const isConfigured = !!apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && !apiKey.startsWith('YOUR_');
    res.status(200).json({
      success: true,
      data: {
        configured: isConfigured
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  streamChat,
  chat,
  getCareerGuidance,
  getChatHistory,
  clearChatHistory,
  getAIStatus
};
