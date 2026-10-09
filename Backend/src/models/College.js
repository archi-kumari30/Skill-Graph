const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College / University name is required'],
      unique: true,
      trim: true
    },
    location: {
      type: String,
      default: 'India',
      trim: true
    },
    website: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    studentCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

collegeSchema.index({ status: 1 });

const College = mongoose.model('College', collegeSchema);

module.exports = College;
