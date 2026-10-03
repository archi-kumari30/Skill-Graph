const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const LearningProgress = require('../models/LearningProgress');
const ChatMessage = require('../models/ChatMessage');
const jobService = require('./jobService');
const skillGapService = require('./skillGapService');
const recommendationService = require('./recommendationService');
const { BadRequestError, NotFoundError } = require('../utils/customErrors');
const https = require('https');

const callGeminiAPI = (prompt) => {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'test') {
      return reject(new Error('Testing mode: live Gemini calls bypassed for test suite speed'));
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.startsWith('YOUR_')) {
      return reject(new Error('GEMINI_API_KEY is not configured'));
    }

    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const postData = JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7
      }
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.candidates && parsed.candidates[0]?.content?.parts[0]?.text) {
            resolve(parsed.candidates[0].content.parts[0].text);
          } else {
            const errMsg = parsed.error?.message || 'Invalid response from Gemini API';
            reject(new Error(errMsg));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(8000, () => {
      req.destroy(new Error('Gemini API request timed out'));
    });

    req.write(postData);
    req.end();
  });
};

const generateFallbackGuidance = (user, userSkills, targetRoleGap, recommendations, question) => {
  const targetRoleName = user.targetRoleId ? user.targetRoleId.name : 'your target career';
  const skillsSummary = userSkills.length > 0
    ? userSkills.map(s => `${s.skillId?.name || 'Skill'} (Level ${s.proficiency}/5)`).join(', ')
    : 'No skills logged yet';

  let advice = `### SkillGraph Career Advisory (Guided Advisor Mode)\n\n`;
  advice += `Hello **${user.name}**! Here is an analysis grounded in your SkillGraph profile:\n\n`;
  advice += `- **Target Role**: ${targetRoleName}\n`;
  advice += `- **Current Skills Inventory**: ${skillsSummary}\n\n`;

  if (targetRoleGap && targetRoleGap.skills && targetRoleGap.skills.length > 0) {
    const missing = targetRoleGap.skills.filter(s => s.status === 'missing');
    const improve = targetRoleGap.skills.filter(s => s.status === 'needs_improvement');
    advice += `#### Key Focus Areas for ${targetRoleName}:\n`;
    if (missing.length > 0) {
      advice += `- **Missing Core Skills**: ${missing.map(m => m.skill?.name || m.skill).join(', ')}\n`;
    }
    if (improve.length > 0) {
      advice += `- **Proficiency Upgrades Needed**: ${improve.map(i => `${i.skill?.name || i.skill} (Aim for Level ${i.requiredProficiency})`).join(', ')}\n`;
    }
  }

  if (recommendations && recommendations.length > 0) {
    advice += `\n#### Recommended Next Steps:\n`;
    recommendations.slice(0, 3).forEach((r, idx) => {
      advice += `${idx + 1}. **${r.skill.name}**: ${r.reason}\n`;
    });
  }

  advice += `\nRegarding your question: *"${question}"*:\n`;
  advice += `We suggest focusing on practical milestones for your highest priority skill gaps. Check the Learning module for beginner roadmaps and quick-win resources!`;

  return advice;
};

const assembleUserContext = async (userId) => {
  const user = await User.findById(userId).populate('targetRoleId');
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const userSkills = await UserSkill.find({ userId }).populate('skillId');
  const learningProgress = await LearningProgress.find({ userId }).populate({
    path: 'resourceId',
    populate: { path: 'skillId' }
  });
  const jobMatches = await jobService.getJobMatches(userId);

  let targetRoleGap = null;
  let recommendations = [];

  if (user.targetRoleId) {
    try {
      targetRoleGap = await skillGapService.calculateGap(userId, user.targetRoleId._id);
      recommendations = await recommendationService.getRecommendations(userId, user.targetRoleId._id);
    } catch (err) {
      // Continue if calculation fails
    }
  }

  const UserTopicProgress = require('../models/UserTopicProgress');
  const completedTopics = await UserTopicProgress.find({ userId });

  return {
    user,
    userSkills,
    learningProgress,
    jobMatches,
    targetRoleGap,
    recommendations,
    completedTopics
  };
};

const getCareerGuidance = async (userId, question, history = []) => {
  const context = await assembleUserContext(userId);
  const { user, userSkills, learningProgress, jobMatches, targetRoleGap, recommendations } = context;

  // Persist user prompt in conversation history
  await ChatMessage.create({
    userId,
    role: 'user',
    content: question
  });

  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && !apiKey.startsWith('YOUR_');

  let reply;
  let isFallback = false;

  if (hasValidKey) {
    try {
      const skillList = userSkills.map(us => `- ${us.skillId?.name || 'Skill'}: Proficiency ${us.proficiency}/5`).join('\n');
      const progressList = learningProgress.map(lp => `- ${lp.resourceId?.title}: ${lp.progressPercentage}% (${lp.status})`).join('\n');
      const recsSummary = recommendations.slice(0, 3).map(r => `- ${r.skill.name}: ${r.reason}`).join('\n');

      const systemPrompt = `You are SkillGraph AI, a career and learning assistant. Answer based on actual student data:
Student Name: ${user.name}
Target Role: ${user.targetRoleId ? user.targetRoleId.name : 'Not set'}
Skills: ${skillList || 'None'}
Progress: ${progressList || 'None'}
Recommendations: ${recsSummary || 'None'}

Student Question: "${question}"
AI:`;

      reply = await callGeminiAPI(systemPrompt);
    } catch (err) {
      console.warn('Gemini API call failed, falling back to grounded rule engine:', err.message);
      reply = generateFallbackGuidance(user, userSkills, targetRoleGap, recommendations, question);
      isFallback = true;
    }
  } else {
    reply = generateFallbackGuidance(user, userSkills, targetRoleGap, recommendations, question);
    isFallback = true;
  }

  // Persist assistant reply in conversation history
  await ChatMessage.create({
    userId,
    role: 'assistant',
    content: reply,
    isFallback
  });

  return {
    response: reply,
    reply,
    isFallback
  };
};

const streamChatResponse = async (userId, question, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const context = await assembleUserContext(userId);
  const { user, userSkills, learningProgress, jobMatches, targetRoleGap, recommendations } = context;

  // Persist user prompt in history
  await ChatMessage.create({
    userId,
    role: 'user',
    content: question
  });

  const apiKey = process.env.GEMINI_API_KEY;
  const hasValidKey = apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && !apiKey.startsWith('YOUR_');

  let fullResponse = '';
  let isFallback = false;

  if (hasValidKey) {
    try {
      const skillList = userSkills.map(us => `- ${us.skillId?.name || 'Skill'}: Proficiency ${us.proficiency}/5`).join('\n');
      const recsSummary = recommendations.slice(0, 3).map(r => `- ${r.skill.name}: ${r.reason}`).join('\n');

      const systemPrompt = `You are SkillGraph AI, a career and learning assistant. Answer based on student data:
Student: ${user.name}
Target Role: ${user.targetRoleId ? user.targetRoleId.name : 'Not set'}
Skills: ${skillList || 'None'}
Recommendations: ${recsSummary || 'None'}

Question: "${question}"
AI:`;

      fullResponse = await callGeminiAPI(systemPrompt);
      res.write(`data: ${JSON.stringify({ chunk: fullResponse, isFallback: false })}\n\n`);
    } catch (err) {
      console.warn('Gemini stream call failed, falling back to grounded rule engine:', err.message);
      fullResponse = generateFallbackGuidance(user, userSkills, targetRoleGap, recommendations, question);
      isFallback = true;
      res.write(`data: ${JSON.stringify({ chunk: fullResponse, isFallback: true })}\n\n`);
    }
  } else {
    fullResponse = generateFallbackGuidance(user, userSkills, targetRoleGap, recommendations, question);
    isFallback = true;
    res.write(`data: ${JSON.stringify({ chunk: fullResponse, isFallback: true })}\n\n`);
  }

  // Persist assistant reply
  await ChatMessage.create({
    userId,
    role: 'assistant',
    content: fullResponse,
    isFallback
  });

  res.write('data: [DONE]\n\n');
  res.end();
};

const getChatHistory = async (userId) => {
  return await ChatMessage.find({ userId })
    .sort({ createdAt: 1 })
    .select('role content isFallback createdAt');
};

const clearChatHistory = async (userId) => {
  return await ChatMessage.deleteMany({ userId });
};

module.exports = {
  getCareerGuidance,
  streamChatResponse,
  getChatHistory,
  clearChatHistory
};
