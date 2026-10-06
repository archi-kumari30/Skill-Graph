const InterviewQuestion = require('../models/InterviewQuestion');
const UserInterviewProgress = require('../models/UserInterviewProgress');
const DailyActivity = require('../models/DailyActivity');
const { catchAsync } = require('../utils/helpers');
const { NotFoundError } = require('../utils/customErrors');

const getInterviewQuestions = catchAsync(async (req, res, next) => {
  const { domain, technology, difficulty, search } = req.query;

  const filter = {};
  if (domain && domain !== 'All') filter.domain = domain;
  if (technology && technology !== 'All') filter.technology = technology;
  if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
  if (search) {
    filter.$or = [
      { question: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } },
      { technology: { $regex: search, $options: 'i' } }
    ];
  }

  const questions = await InterviewQuestion.find(filter).sort({ order: 1, createdAt: 1 }).lean();

  let masteredSet = new Set();
  if (req.user) {
    const userProgress = await UserInterviewProgress.find({
      userId: req.user._id,
      mastered: true
    }).select('questionId').lean();
    masteredSet = new Set(userProgress.map(p => p.questionId.toString()));
  }

  // Calculate stats
  const enriched = questions.map(q => ({
    ...q,
    isMastered: masteredSet.has(q._id.toString())
  }));

  const allQuestionsTotal = await InterviewQuestion.countDocuments();
  const userMasteredTotal = req.user
    ? await UserInterviewProgress.countDocuments({ userId: req.user._id, mastered: true })
    : 0;

  // Available filters
  const allTechs = await InterviewQuestion.distinct('technology');
  const allDomains = await InterviewQuestion.distinct('domain');

  res.status(200).json({
    success: true,
    data: {
      questions: enriched,
      stats: {
        totalQuestions: allQuestionsTotal,
        masteredCount: userMasteredTotal,
        masteryPercentage: allQuestionsTotal > 0 ? Math.round((userMasteredTotal / allQuestionsTotal) * 100) : 0
      },
      availableTechnologies: allTechs,
      availableDomains: allDomains
    }
  });
});

const getQuestionById = catchAsync(async (req, res, next) => {
  const question = await InterviewQuestion.findById(req.params.id).lean();
  if (!question) {
    throw new NotFoundError('Interview question not found');
  }

  let isMastered = false;
  if (req.user) {
    const prog = await UserInterviewProgress.findOne({
      userId: req.user._id,
      questionId: req.params.id
    });
    isMastered = prog ? prog.mastered : false;
  }

  res.status(200).json({
    success: true,
    data: {
      ...question,
      isMastered
    }
  });
});

const toggleMastered = catchAsync(async (req, res, next) => {
  const question = await InterviewQuestion.findById(req.params.id);
  if (!question) {
    throw new NotFoundError('Interview question not found');
  }

  const existing = await UserInterviewProgress.findOne({
    userId: req.user._id,
    questionId: question._id
  });

  let newStatus = true;
  if (existing) {
    newStatus = !existing.mastered;
    existing.mastered = newStatus;
    await existing.save();
  } else {
    await UserInterviewProgress.create({
      userId: req.user._id,
      questionId: question._id,
      mastered: true
    });
    newStatus = true;
  }

  if (newStatus) {
    const today = new Date().toISOString().split('T')[0];
    await DailyActivity.create({
      userId: req.user._id,
      date: today,
      activityType: 'interview_prep',
      title: `Mastered ${question.technology} Question`,
      details: question.question.substring(0, 70),
      minutesSpent: 10
    });
  }

  res.status(200).json({
    success: true,
    message: newStatus ? 'Marked as mastered' : 'Removed from mastered',
    data: {
      questionId: question._id,
      isMastered: newStatus
    }
  });
});

module.exports = {
  getInterviewQuestions,
  getQuestionById,
  toggleMastered
};
