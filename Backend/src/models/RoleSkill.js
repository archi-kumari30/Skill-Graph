const mongoose = require('mongoose');

const roleSkillSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: [true, 'Role ID is required']
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: [true, 'Skill ID is required']
    },
    requiredProficiency: {
      type: Number,
      required: [true, 'Required proficiency is required'],
      min: [1, 'Required proficiency must be at least 1'],
      max: [5, 'Required proficiency cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Required proficiency must be an integer'
      }
    },
    importance: {
      type: String,
      required: [true, 'Importance is required'],
      enum: {
        values: ['required', 'important', 'nice_to_have'],
        message: 'Importance must be required, important, or nice_to_have'
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure a role cannot have duplicate skill requirements
roleSkillSchema.index({ roleId: 1, skillId: 1 }, { unique: true });

const RoleSkill = mongoose.model('RoleSkill', roleSkillSchema);

module.exports = RoleSkill;
