const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      unique: true,
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
    }
  },
  {
    timestamps: true
  }
);

// Search indexes
skillSchema.index({ name: 'text', category: 'text', aliases: 'text' });

const Skill = mongoose.model('Skill', skillSchema);

module.exports = Skill;
