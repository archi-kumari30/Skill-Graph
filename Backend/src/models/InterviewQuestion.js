const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      enum: ['Frontend', 'Backend', 'Database', 'Computer Science', 'General', 'DevOps', 'Tools', 'Architecture', 'Quality Assurance', 'DevOps & Tools', 'Full Stack'],
      index: true
    },
    technology: {
      type: String,
      required: [true, 'Technology is required'],
      trim: true,
      index: true
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    question: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true
    },
    answer: {
      type: String,
      required: [true, 'Answer explanation is required']
    },
    codeSnippet: {
      type: String,
      default: ''
    },
    keyPoints: [
      {
        type: String
      }
    ],
    companyTags: [
      {
        type: String
      }
    ],
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

interviewQuestionSchema.index({ technology: 1, difficulty: 1 });
interviewQuestionSchema.index({ domain: 1, technology: 1 });

const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);

module.exports = InterviewQuestion;
