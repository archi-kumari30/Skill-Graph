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
    max: 5,
    default: 3
  },
  expectedProficiency: {
    type: Number,
    min: 1,
    max: 5,
    default: function() {
      return this.requiredProficiency || 3;
    }
  },
  importance: {
    type: String,
    enum: ['required', 'important', 'nice_to_have', 'Required', 'Important', 'Nice to Have'],
    default: 'required'
  },
  requirementType: {
    type: String,
    enum: ['required', 'preferred', 'optional'],
    default: 'required'
  },
  required: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const jobSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  companyName: {
    type: String,
    trim: true,
    default: ''
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  openings: {
    type: Number,
    default: 1
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: 'Remote'
  },
  employmentType: {
    type: String,
    default: 'Full-time'
  },
  jobType: {
    type: String,
    default: 'Full Time'
  },
  workMode: {
    type: String,
    enum: ['Remote', 'Hybrid', 'On-site', 'remote', 'hybrid', 'on-site'],
    default: 'Hybrid'
  },
  experienceLevel: {
    type: String,
    default: 'Mid'
  },
  experience: {
    type: String,
    trim: true,
    default: '0–2 years'
  },
  salaryRange: {
    type: String,
    trim: true,
    default: ''
  },
  salary: {
    type: String,
    trim: true,
    default: ''
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
    default: 'INR',
    trim: true
  },
  applicationUrl: {
    type: String,
    trim: true,
    default: ''
  },
  deadline: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Closed', 'draft', 'active', 'closed'],
    default: 'Active'
  },
  educationRequirements: {
    degree: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    minGraduationYear: { type: Number, default: null },
    minCgpa: { type: Number, default: null }
  },
  requirements: [jobRequirementSchema],
  postedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: 'SkillGraph Internal'
  },
  sourceUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

jobSchema.pre('save', function(next) {
  if (this.requirements && Array.isArray(this.requirements)) {
    this.requirements.forEach(req => {
      if (!req.expectedProficiency && req.requiredProficiency) {
        req.expectedProficiency = req.requiredProficiency;
      }
      if (!req.requiredProficiency && req.expectedProficiency) {
        req.requiredProficiency = req.expectedProficiency;
      }
      const imp = (req.importance || '').toLowerCase().replace(/\s+/g, '_');
      req.required = imp === 'required';
    });
  }
  if (!this.salary && this.salaryRange) {
    this.salary = this.salaryRange;
  }
  if (!this.salaryRange && this.salary) {
    this.salaryRange = this.salary;
  }
  if (!this.jobType && this.employmentType) {
    this.jobType = this.employmentType;
  }
  if (!this.experience && this.experienceLevel) {
    this.experience = this.experienceLevel;
  }
  if (!this.applicationUrl && this.sourceUrl) {
    this.applicationUrl = this.sourceUrl;
  }
  next();
});

jobSchema.index({ companyId: 1, postedAt: -1 });
jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ salaryMin: 1, salaryMax: 1 });
jobSchema.index({ experienceLevel: 1, employmentType: 1 });

module.exports = mongoose.model('Job', jobSchema);
