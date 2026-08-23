const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const { BadRequestError, UnauthorizedError, ConflictError } = require('../utils/customErrors');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const register = async (userData) => {
  const { name, email, password, accountRole, department, branch, college, yearOfStudy } = userData;

  if (!email || !password || !name) {
    throw new BadRequestError('Please provide name, email, and password');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already in use');
  }

  const user = await User.create({
    name,
    email,
    password,
    accountRole: accountRole || 'employee',
    department: department || '',
    branch: branch || '',
    college: college || '',
    yearOfStudy: yearOfStudy || ''
  });

  const token = generateToken(user._id);

  // Return user without password
  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

const login = async (email, password) => {
  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  // Explicitly select password field since it is selected false by default
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  const token = generateToken(user._id);

  const userResponse = user.toObject();
  delete userResponse.password;

  return { user: userResponse, token };
};

module.exports = {
  register,
  login,
  generateToken
};
