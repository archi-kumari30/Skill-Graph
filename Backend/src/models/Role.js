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
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
