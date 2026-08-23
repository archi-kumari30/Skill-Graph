const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Skill category is required'],
      trim: true
    },
    aliases: {
      type: [String],
      default: []
    },
    isPersonal: {
      type: Boolean,
      default: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index for { name, userId }
skillSchema.index({ name: 1, userId: 1 }, { unique: true });

// Search indexes
skillSchema.index({ name: 'text', category: 'text', aliases: 'text' });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
