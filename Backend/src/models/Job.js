const mongoose = require('mongoose');

const jobRequirementSchema = new mongoose.Schema({
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  },
  requiredProficiency: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  importance: {
    type: String,
    enum: ['required', 'important', 'nice_to_have'],
    default: 'required'
  },
  requirementType: {
    type: String,
    enum: ['required', 'preferred'],
    default: 'required'
  }
}, { _id: false });

const jobSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  location: {
    type: String,
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time'
  },
  experienceLevel: {
    type: String,
    enum: ['Junior', 'Mid', 'Senior', 'Lead'],
    default: 'Mid'
  },
  salaryRange: {
    type: String,
    trim: true
  },
  salaryMin: {
    type: Number,
    default: null
  },
  salaryMax: {
    type: Number,
    default: null
  },
  salaryCurrency: {
    type: String,
    default: 'USD',
    trim: true
  },
  requirements: [jobRequirementSchema],
  postedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'Internal'
  },
  sourceUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

jobSchema.index({ companyId: 1, postedAt: -1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1 });
jobSchema.index({ experienceLevel: 1, employmentType: 1 });

module.exports = mongoose.model('Job', jobSchema);
