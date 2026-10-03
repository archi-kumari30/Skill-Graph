const mongoose = require('mongoose');

const learningProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningResource',
      required: true
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress'
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    proofUrl: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee one progress record per user per resource
learningProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

module.exports = mongoose.model('LearningProgress', learningProgressSchema);
