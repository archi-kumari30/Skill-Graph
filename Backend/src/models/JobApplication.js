const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['applied', 'reviewing', 'interviewing', 'rejected', 'offered'],
        message: 'Status must be applied, reviewing, interviewing, rejected, or offered'
      },
      default: 'applied',
      index: true
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: ''
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring a user can only apply once per job
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;
