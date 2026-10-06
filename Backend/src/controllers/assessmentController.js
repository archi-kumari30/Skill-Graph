const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const UserSkill = require('../models/UserSkill');
const DailyActivity = require('../models/DailyActivity');
const Topic = require('../models/Topic');
const { catchAsync } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');

// Get all active assessments
const getAllAssessments = catchAsync(async (req, res, next) => {
  const filter = { isActive: true };
  if (req.query.skillId) {
    filter.skillId = req.query.skillId;
  }
  if (req.query.difficulty) {
    filter.difficulty = req.query.difficulty;
  }

  const assessments = await Assessment.find(filter)
    .populate('skillId', 'name category description')
    .lean();

  // If user is authenticated, attach their best attempt
  let userAttempts = [];
  if (req.user) {
    userAttempts = await AssessmentAttempt.find({ userId: req.user._id })
      .select('assessmentId score passed completedAt')
      .lean();
  }

  const attemptMap = {};
  userAttempts.forEach(att => {
    const aId = att.assessmentId.toString();
    if (!attemptMap[aId] || att.score > attemptMap[aId].score) {
      attemptMap[aId] = att;
    }
  });

  const enriched = assessments.map(a => ({
    ...a,
    totalQuestions: a.questions ? a.questions.length : 0,
    questions: undefined, // Don't expose question IDs in list
    bestAttempt: attemptMap[a._id.toString()] || null
  }));

  res.status(200).json({
    success: true,
    data: enriched
  });
});

// Get single assessment details and test questions (without answers)
const getAssessmentById = catchAsync(async (req, res, next) => {
  const assessment = await Assessment.findById(req.params.id)
    .populate('skillId', 'name category')
    .populate({
      path: 'questions',
      select: 'prompt codeSnippet options difficulty topicId'
    });

  if (!assessment) {
    throw new NotFoundError('Assessment not found');
  }

  res.status(200).json({
    success: true,
    data: assessment
  });
});

// Submit answers and evaluate attempt
const submitAssessment = catchAsync(async (req, res, next) => {
  const { answers } = req.body; // array of { questionId, selectedOptionId }
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    throw new BadRequestError('Answers array is required');
  }

  const assessment = await Assessment.findById(req.params.id)
    .populate('questions')
    .populate('skillId');

  if (!assessment) {
    throw new NotFoundError('Assessment not found');
  }

  const questionMap = {};
  assessment.questions.forEach(q => {
    questionMap[q._id.toString()] = q;
  });

  let correctCount = 0;
  const gradedAnswers = [];
  const weakTopicIds = new Set();
  const strongTopicIds = new Set();

  for (const submitted of answers) {
    const question = questionMap[submitted.questionId];
    if (!question) continue;

    const isCorrect = submitted.selectedOptionId === question.correctOptionId;
    if (isCorrect) {
      correctCount++;
      if (question.topicId) strongTopicIds.add(question.topicId.toString());
    } else {
      if (question.topicId) weakTopicIds.add(question.topicId.toString());
    }

    gradedAnswers.push({
      questionId: question._id,
      prompt: question.prompt,
      selectedOptionId: submitted.selectedOptionId,
      correctOptionId: question.correctOptionId,
      isCorrect,
      explanation: question.explanation
    });
  }

  const totalQuestions = assessment.questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = score >= (assessment.passingScore || 70);

  // Resolve weak topic names
  const weakTopics = [];
  if (weakTopicIds.size > 0) {
    const topics = await Topic.find({ _id: { $in: Array.from(weakTopicIds) } });
    topics.forEach(t => weakTopics.push(t.title));
  }

  // Fallback: If learner failed and no specific topic was tagged on questions, provide skill's topics as guidance
  if (!passed && weakTopics.length === 0 && assessment.skillId) {
    const sId = assessment.skillId._id || assessment.skillId;
    const skillTopics = await Topic.find({ skillId: sId }).limit(3);
    skillTopics.forEach(t => weakTopics.push(t.title));
    if (weakTopics.length === 0) {
      weakTopics.push(`${assessment.skillId.name || 'Core'} Fundamentals`);
    }
  }

  const strongTopics = [];
  if (strongTopicIds.size > 0) {
    const topics = await Topic.find({ _id: { $in: Array.from(strongTopicIds) } });
    topics.forEach(t => strongTopics.push(t.title));
  }

  // Save attempt
  const attempt = await AssessmentAttempt.create({
    userId: req.user._id,
    assessmentId: assessment._id,
    skillId: assessment.skillId._id,
    score,
    passed,
    totalQuestions,
    correctCount,
    answers: gradedAnswers.map(g => ({
      questionId: g.questionId,
      selectedOptionId: g.selectedOptionId,
      isCorrect: g.isCorrect
    })),
    weakTopics,
    strongTopics
  });

  // If passed, verify user skill
  let updatedSkill = null;
  if (passed && assessment.skillId) {
    const skillId = assessment.skillId._id;
    updatedSkill = await UserSkill.findOne({ userId: req.user._id, skillId });

    const targetProficiency = assessment.difficulty === 'advanced' ? 4 : assessment.difficulty === 'intermediate' ? 3 : 2;

    if (updatedSkill) {
      updatedSkill.verified = true;
      updatedSkill.verificationStatus = 'verified';
      updatedSkill.verifiedAt = new Date();
      updatedSkill.lastAssessedAt = new Date();
      if (updatedSkill.proficiency < targetProficiency) {
        updatedSkill.proficiency = targetProficiency;
      }
      await updatedSkill.save();
    } else {
      updatedSkill = await UserSkill.create({
        userId: req.user._id,
        skillId,
        proficiency: targetProficiency,
        verified: true,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        lastAssessedAt: new Date()
      });
    }

    // Log DailyActivity
    const today = new Date().toISOString().split('T')[0];
    await DailyActivity.create({
      userId: req.user._id,
      date: today,
      activityType: 'assessment_passed',
      title: `Verified skill in ${assessment.skillId.name}`,
      details: `Scored ${score}% on "${assessment.title}"`,
      minutesSpent: assessment.timeLimitMinutes || 20
    });

    // Dispatch real in-app notification for verified skill
    try {
      const notificationService = require('../services/notificationService');
      await notificationService.createNotification({
        userId: req.user._id,
        type: 'assessment_result',
        title: `Skill Verified: ${assessment.skillId.name}`,
        message: `Congratulations! You scored ${score}% on the ${assessment.title} assessment and verified your skill.`,
        link: `/skills/${assessment.skillId._id}`,
        metadata: {
          assessmentId: assessment._id,
          skillId: assessment.skillId._id,
          score,
          difficulty: assessment.difficulty
        }
      });
    } catch (notifErr) {
      console.warn('Could not create assessment passed notification:', notifErr.message);
    }
  } else {
    // Log attempt activity
    const today = new Date().toISOString().split('T')[0];
    await DailyActivity.create({
      userId: req.user._id,
      date: today,
      activityType: 'assessment_attempted',
      title: `Attempted ${assessment.title}`,
      details: `Scored ${score}% (Passing score: ${assessment.passingScore || 70}%)`,
      minutesSpent: assessment.timeLimitMinutes || 15
    });
  }

  res.status(200).json({
    success: true,
    data: {
      attemptId: attempt._id,
      score,
      passed,
      passingScore: assessment.passingScore,
      correctCount,
      totalQuestions,
      weakTopics,
      strongTopics,
      answers: gradedAnswers,
      updatedSkill
    }
  });
});

// Get authenticated user's attempt history
const getMyAttempts = catchAsync(async (req, res, next) => {
  const attempts = await AssessmentAttempt.find({ userId: req.user._id })
    .populate('assessmentId', 'title difficulty passingScore')
    .populate('skillId', 'name category')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: attempts
  });
});

module.exports = {
  getAllAssessments,
  getAssessmentById,
  submitAssessment,
  getMyAttempts
};
