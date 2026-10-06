const mongoose = require('mongoose');

const userInterviewProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: true,
      index: true
    },
    mastered: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

userInterviewProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });

const UserInterviewProgress = mongoose.model('UserInterviewProgress', userInterviewProgressSchema);

module.exports = UserInterviewProgress;
