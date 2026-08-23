const mongoose = require('mongoose');

const userTopicProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  topicTitle: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure uniqueness per user, skill, and topic
userTopicProgressSchema.index({ userId: 1, skillId: 1, topicTitle: 1 }, { unique: true });

module.exports = mongoose.model('UserTopicProgress', userTopicProgressSchema);