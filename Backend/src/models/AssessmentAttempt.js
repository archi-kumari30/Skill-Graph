const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment ID is required'],
      index: true
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required'],
      index: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    passed: {
      type: Boolean,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    correctCount: {
      type: Number,
      required: true
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question'
        },
        selectedOptionId: String,
        isCorrect: Boolean
      }
    ],
    weakTopics: [
      {
        type: String
      }
    ],
    strongTopics: [
      {
        type: String
      }
    ],
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, createdAt: -1 });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

module.exports = AssessmentAttempt;
