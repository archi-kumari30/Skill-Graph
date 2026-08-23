const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const LearningProgress = require('../models/LearningProgress');
const jobService = require('./jobService');
const skillGapService = require('./skillGapService');
const recommendationService = require('./recommendationService');
const { BadRequestError } = require('../utils/customErrors');
const https = require('https');

const callGeminiAPI = (prompt) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      console.log("Gemini client configured");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt }
          ]
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

    console.log("Gemini request sent");
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`Gemini response received. HTTP status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content && parsed.candidates[0].content.parts[0]) {
            resolve(parsed.candidates[0].content.parts[0].text);
          } else {
            const errMsg = parsed.error?.message || 'Invalid response format from Gemini API';
            const errType = parsed.error?.status || 'API_ERROR';
            console.error(`Gemini API Error. Status/Type: ${errType}, Message: ${errMsg}`);
            reject(new Error(errMsg));
          }
        } catch (e) {
          console.error(`Failed to parse Gemini response: ${e.message}`);
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Gemini request network error: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

const getCareerGuidance = async (userId, question, history = []) => {
  console.log("AI request started");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.startsWith('YOUR_')) {
    throw new BadRequestError('AI Career Assistant is not configured. Please set a valid GEMINI_API_KEY in the backend environment.');
  }

  const user = await User.findById(userId).populate('targetRoleId');
  if (!user) {
    throw new Error('User not found');
  }

  // 1. Gather all actual data points from database
  let userSkills;
  let learningProgress;
  let jobMatches;
  let targetRoleGap = null;
  let recommendations = [];
  let completedTopics;

  if (process.env.USE_GRAPH_DB === 'true') {
    const graphService = require('./graphService');
    userSkills = await graphService.getUserSkills(userId);
    learningProgress = await graphService.getLearningProgress(userId);
    jobMatches = await graphService.getJobMatches(userId);
    
    if (user.targetRoleId) {
      try {
        targetRoleGap = await graphService.getSkillGaps(userId, user.targetRoleId._id.toString());
        recommendations = await graphService.getRecommendations(userId, user.targetRoleId._id.toString());
      } catch (err) {
        // Ignore if calculation fails
      }
    }
    completedTopics = await graphService.getTopicProgress(userId);
  } else {
    userSkills = await UserSkill.find({ userId }).populate('skillId');
    learningProgress = await LearningProgress.find({ userId }).populate({
      path: 'resourceId',
      populate: { path: 'skillId' }
    });
    jobMatches = await jobService.getJobMatches(userId);
    
    if (user.targetRoleId) {
      try {
        targetRoleGap = await skillGapService.calculateGap(userId, user.targetRoleId._id);
        recommendations = await recommendationService.getRecommendations(userId, user.targetRoleId._id);
      } catch (err) {
        // Ignore if calculation fails
      }
    }
    const UserTopicProgress = require('../models/UserTopicProgress');
    completedTopics = await UserTopicProgress.find({ userId });
  }

  // Group completed count by skillId
  const topicCountMap = {};
  completedTopics.forEach(tp => {
    const sIdStr = tp.skillId ? tp.skillId.toString() : '';
    if (sIdStr) {
      topicCountMap[sIdStr] = (topicCountMap[sIdStr] || 0) + 1;
    }
  });

  const SKILL_TOTAL_TOPICS = {
    'HTML': 7,
    'CSS': 7,
    'JavaScript': 10,
    'React': 8,
    'Git': 4,
    'Node.js': 7,
    'Express': 6,
    'MongoDB': 6
  };

  const topicsProgressList = userSkills.map(us => {
    const sIdStr = us.skillId?._id?.toString() || us.skillId?.toString() || '';
    const completedCount = topicCountMap[sIdStr] || 0;
    const totalCount = SKILL_TOTAL_TOPICS[us.skillId?.name] || 3;
    return `- ${us.skillId?.name || 'Skill'}: ${completedCount}/${totalCount} learning topics completed (${Math.round((completedCount / totalCount) * 100)}%)`;
  }).join('\n');

  // 2. Synthesize prompt context
  const skillList = userSkills.map(us => `- ${us.skillId?.name || 'Skill'}: Proficiency Level ${us.proficiency}/5, Experience: ${us.yearsOfExperience || 0} years`).join('\n');
  
  const progressList = learningProgress.map(lp => `- Course: "${lp.resourceId?.title}", Skill: ${lp.resourceId?.skillId?.name}, Progress: ${lp.progressPercentage}%, Status: ${lp.status}`).join('\n');

  const jobsSummary = jobMatches.slice(0, 3).map(jm => `- ${jm.title} at ${jm.company.name} (Match: ${jm.matchScore}%, Gaps: ${jm.missingSkills + jm.skillsToImprove} skills)`).join('\n');

  const gapsSummary = targetRoleGap ? targetRoleGap.skills.map(s => `- ${s.skill.name}: Required: ${s.requiredProficiency}/5, Current: ${s.currentProficiency}/5, Gap status: ${s.status}`).join('\n') : 'No target role selected.';

  const recsSummary = recommendations.slice(0, 4).map(r => `- Focus on: ${r.skill.name} (Priority: ${r.priority}/100) - Reason: ${r.reason}`).join('\n');

  // Format history messages (last 8 messages for context window size)
  let historyText = '';
  if (Array.isArray(history) && history.length > 0) {
    historyText = history.slice(-8).map(msg => `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');
  }

  const systemInstruction = `You are SkillGraph AI, a career and learning assistant inside the SkillGraph platform.

Your job is to help students understand their skills, identify gaps, learn technical concepts, plan learning paths, and prepare for careers.

You have access to the student's SkillGraph profile, including their current skills, proficiency levels, target career, required skills, skill gaps, recommendations, and learning progress.

When answering questions about the student's progress or recommendations, use the provided SkillGraph data rather than inventing information.

When explaining technical concepts, teach clearly and progressively. Use simple language when the student appears to be a beginner. For technical questions, provide examples when useful. For career questions, connect recommendations to the student's target role.

Never claim that the student completed a skill or topic unless the provided data confirms it. Never invent student progress.

If information about the student's profile is unavailable, clearly say that you don't have that information.

You are not limited to career questions. You can answer general programming, computer science, learning, interview, and career-development questions.`;

  const systemPrompt = `${systemInstruction}

Student Profile Context:
- Name: ${user.name}
- Department: ${user.department || 'Not set'}
- Target Role: ${user.targetRoleId ? `${user.targetRoleId.name} (${user.targetRoleId.level})` : 'Not set'}

Student Skills Inventory:
${skillList || 'No skills logged.'}

Detailed Learning Checklist Progress:
${topicsProgressList || 'No topics completed yet.'}

Learning Course Progress:
${progressList || 'No active courses.'}

Matched Sample Jobs:
${jobsSummary || 'No jobs matches compiled.'}

Target Role Gaps details:
${gapsSummary}

Roadmap Recommendations:
${recsSummary || 'No recommendation list compiled.'}

Recent Conversation History:
${historyText || 'No prior messages.'}

Student's Latest Question: "${question}"
AI:`;

  // 3. Make request
  return await callGeminiAPI(systemPrompt);
};

module.exports = {
  getCareerGuidance
};
