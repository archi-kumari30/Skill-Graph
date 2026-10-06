const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    fullName: {
      type: String,
      default: '',
      trim: true
    },
    email: {
      type: String,
      default: '',
      trim: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    education: {
      type: String,
      default: '',
      trim: true
    },
    portfolioUrl: {
      type: String,
      default: '',
      trim: true
    },
    skills: [
      {
        type: String,
        trim: true
      }
    ],
    status: {
      type: String,
      enum: {
        values: [
          'applied', 'Applied',
          'under_review', 'Under Review', 'screening', 'reviewing',
          'shortlisted', 'Shortlisted',
          'interview', 'Interview', 'interviewing',
          'rejected', 'Rejected',
          'offered', 'Offered', 'selected', 'Selected',
          'withdrawn', 'Withdrawn'
        ],
        message: 'Invalid application status'
      },
      default: 'applied',
      index: true
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true
    },
    coverLetter: {
      type: String,
      default: '',
      trim: true
    },
    matchScore: {
      type: Number,
      default: 0
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
jobApplicationSchema.index({ userId: 1, status: 1 });
jobApplicationSchema.index({ jobId: 1, status: 1 });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

module.exports = JobApplication;
