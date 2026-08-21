const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required']
    },
    proficiency: {
      type: Number,
      required: [true, 'Proficiency is required'],
      min: [1, 'Proficiency must be at least 1 (Beginner)'],
      max: [5, 'Proficiency cannot exceed 5 (Expert)'],
      validate: {
        validator: Number.isInteger,
        message: 'Proficiency must be an integer value between 1 and 5'
      }
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative']
    },
    lastAssessedAt: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      default: 'self',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure a user cannot have duplicate skill entries
userSkillSchema.index({ userId: 1, skillId: 1 }, { unique: true });

const UserSkill = mongoose.model('UserSkill', userSkillSchema);

module.exports = UserSkill;
