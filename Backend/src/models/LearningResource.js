const mongoose = require('mongoose');

const learningResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required']
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: 'Difficulty must be beginner, intermediate, or advanced'
      }
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: [0, 'Estimated hours cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

const LearningResource = mongoose.model('LearningResource', learningResourceSchema);

module.exports = LearningResource;
