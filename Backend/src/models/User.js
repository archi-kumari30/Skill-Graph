const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    accountRole: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'employee', 'student'],
        message: 'Role must be admin, manager, employee, or student'
      },
      default: 'employee'
    },
    department: {
      type: String,
      default: ''
    },
    targetRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role'
    },
    savedRoleIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
      }
    ],
    resetPasswordToken: {
      type: String,
      select: false,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: null
    },
    branch: {
      type: String,
      default: ''
    },
    college: {
      type: String,
      default: ''
    },
    yearOfStudy: {
      type: String,
      default: ''
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    weeklyStudyHours: {
      type: Number,
      default: 10
    },
    primaryFocus: {
      type: String,
      default: 'Full Stack Development'
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ department: 1, accountRole: 1 });
userSchema.index({ college: 1, branch: 1 });

// Hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
