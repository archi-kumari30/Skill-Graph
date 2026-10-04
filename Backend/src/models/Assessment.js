const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required'],
      index: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    passingScore: {
      type: Number,
      default: 70, // percentage threshold
      min: 50,
      max: 100
    },
    timeLimitMinutes: {
      type: Number,
      default: 15,
      min: 3,
      max: 60
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

assessmentSchema.index({ skillId: 1, isActive: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
