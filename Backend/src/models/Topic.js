const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Topic title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Topic slug is required'],
      lowercase: true,
      trim: true
    },
    order: {
      type: Number,
      default: 0
    },
    summary: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index ensuring topic slugs are unique per skill
topicSchema.index({ skillId: 1, slug: 1 }, { unique: true });
topicSchema.index({ skillId: 1, order: 1 });

const Topic = mongoose.model('Topic', topicSchema);

module.exports = Topic;
