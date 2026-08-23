const Job = require('../models/Job');
const UserSkill = require('../models/UserSkill');
const User = require('../models/User');
const Company = require('../models/Company');
const Skill = require('../models/Skill');
const graphService = require('./graphService');
const { NotFoundError } = require('../utils/customErrors');
const { calculateReadiness } = require('../utils/scoring');

const generateJobMatchExplanation = (title, matchScore, matchedCount, missingCount, improveCount) => {
  if (matchScore >= 80) {
    return `Excellent match (Score: ${matchScore}%). You satisfy almost all core required proficiencies for the ${title} position. You have ${matchedCount} mastered requirements and only need minor adjustments.`;
  } else if (matchScore >= 50) {
    return `Good match (Score: ${matchScore}%). You meet several requirements for ${title}, but there are ${missingCount} missing skill(s) and ${improveCount} skill(s) that require proficiency upgrades.`;
  } else {
    return `Gap warning (Score: ${matchScore}%). There is a significant divergence between your current profile and the required skill levels. You are missing ${missingCount} key skill(s). We recommend completing the prerequisite learning paths first.`;
  }
};

const getJobMatches = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (process.env.USE_GRAPH_DB === 'true') {
    return await graphService.getJobMatches(userId);
  }

  // 1. Fetch user skills
  const userSkills = await UserSkill.find({ userId });
  const userSkillMap = {};
  userSkills.forEach(us => {
    if (us.skillId) {
      userSkillMap[us.skillId.toString()] = us.proficiency;
    }
  });

  const UserTopicProgress = require('../models/UserTopicProgress');
  const completedTopics = await UserTopicProgress.find({ userId });
  const topicCompletionMap = {};
  completedTopics.forEach(tp => {
    if (tp.skillId) {
      const sId = tp.skillId.toString();
      topicCompletionMap[sId] = (topicCompletionMap[sId] || 0) + 1;
    }
  });

  // 2. Fetch all jobs
  const jobs = await Job.find()
    .populate('companyId')
    .populate('requirements.skillId');

  const matches = [];

  for (const job of jobs) {
    // 3. Compute readiness using shared scoring formula
    const analysis = calculateReadiness(job.requirements, userSkillMap, topicCompletionMap);

    matches.push({
      jobId: job._id,
      title: job.title,
      company: {
        id: job.companyId?._id,
        name: job.companyId?.name || 'Unknown Company',
        description: job.companyId?.description,
        industry: job.companyId?.industry,
        website: job.companyId?.website,
        location: job.companyId?.location
      },
      description: job.description,
      location: job.location,
      employmentType: job.employmentType,
      experienceLevel: job.experienceLevel,
      salaryRange: job.salaryRange,
      matchScore: analysis.readinessScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      skillsToImprove: analysis.skillsToImprove,
      skills: analysis.skills,
      explanation: generateJobMatchExplanation(
        job.title,
        analysis.readinessScore,
        analysis.matchedSkills,
        analysis.missingSkills,
        analysis.skillsToImprove
      ),
      source: job.source,
      sourceUrl: job.sourceUrl
    });
  }

  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
};

module.exports = {
  getJobMatches
};
