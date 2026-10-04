const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true
    },
    technologies: [
      {
        type: String,
        trim: true
      }
    ],
    skillsUsed: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill'
      }
    ],
    githubUrl: {
      type: String,
      default: '',
      trim: true
    },
    liveUrl: {
      type: String,
      default: '',
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    highlights: [
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

projectSchema.index({ userId: 1, createdAt: -1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
