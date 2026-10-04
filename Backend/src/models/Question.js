const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required'],
      index: true
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Topic',
      default: null
    },
    prompt: {
      type: String,
      required: [true, 'Question prompt is required'],
      trim: true
    },
    codeSnippet: {
      type: String,
      default: ''
    },
    options: [
      {
        id: {
          type: String,
          required: true
        },
        text: {
          type: String,
          required: true
        }
      }
    ],
    correctOptionId: {
      type: String,
      required: [true, 'Correct option ID is required']
    },
    explanation: {
      type: String,
      default: ''
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },
  {
    timestamps: true
  }
);

questionSchema.index({ skillId: 1, difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
