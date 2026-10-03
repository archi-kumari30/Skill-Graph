const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: '',
      trim: true
    },
    level: {
      type: String,
      enum: {
        values: ['junior', 'mid', 'senior', 'all'],
        message: 'Level must be junior, mid, senior, or all'
      },
      default: 'all',
      set: (val) => (val ? val.toLowerCase() : 'all'),
      index: true
    }
  },
  {
    timestamps: true
  }
);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
