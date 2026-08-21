const mongoose = require('mongoose');

const skillRelationshipSchema = new mongoose.Schema(
  {
    sourceSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Source skill ID is required']
    },
    targetSkillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Target skill ID is required']
    },
    relationshipType: {
      type: String,
      required: [true, 'Relationship type is required'],
      enum: {
        values: ['prerequisite', 'related', 'complementary', 'specialization'],
        message: 'Type must be prerequisite, related, complementary, or specialization'
      }
    },
    strength: {
      type: Number,
      min: [0, 'Strength must be at least 0'],
      max: [1, 'Strength cannot exceed 1'],
      default: 1.0
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent duplicate relationships between the same two skills
skillRelationshipSchema.index({ sourceSkillId: 1, targetSkillId: 1 }, { unique: true });

const SkillRelationship = mongoose.model('SkillRelationship', skillRelationshipSchema);

module.exports = SkillRelationship;
