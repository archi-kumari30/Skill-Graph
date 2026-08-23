const aiService = require('../services/aiService');

const getCareerGuidance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { question, history } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: { message: 'question is required in request body' }
      });
    }

    const response = await aiService.getCareerGuidance(userId, question, history);
    res.status(200).json({
      success: true,
      data: {
        response
      }
    });
  } catch (error) {
    next(error);
  }
};

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
  getCareerGuidance,
  getAIStatus
};
