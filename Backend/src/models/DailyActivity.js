const mongoose = require('mongoose');

const dailyActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date string is required'],
      index: true
    },
    activityType: {
      type: String,
      enum: [
        'topic_completed',
        'assessment_passed',
        'assessment_attempted',
        'project_added',
        'practice_session',
        'skill_added'
      ],
      required: [true, 'Activity type is required']
    },
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true
    },
    details: {
      type: String,
      default: '',
      trim: true
    },
    minutesSpent: {
      type: Number,
      default: 30,
      min: 5
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

dailyActivitySchema.index({ userId: 1, date: -1 });

const DailyActivity = mongoose.model('DailyActivity', dailyActivitySchema);

module.exports = DailyActivity;
