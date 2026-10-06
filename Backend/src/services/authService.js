const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuthToken = require('../models/AuthToken');
const config = require('../config/config');
const { BadRequestError, UnauthorizedError, ConflictError, ForbiddenError } = require('../utils/customErrors');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const generateToken = (id, role = 'student') => {
  return jwt.sign({ id, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn || '15m'
  });
};

const generateTokens = async (user, req) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.accountRole },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn || '15m' }
  );

  const rawRefreshToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await AuthToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    revoked: false,
    ipAddress: req?.ip || req?.connection?.remoteAddress || '',
    userAgent: req?.headers ? req.headers['user-agent'] : ''
  });

  return { accessToken, refreshToken: rawRefreshToken, expiresAt };
};

const register = async (userData, req) => {
  const { name, email, password, accountRole, company, phone, department, branch, college, yearOfStudy } = userData;

  if (!email || !password || !name) {
    throw new BadRequestError('Please provide name, email, and password');
  }

  if (password.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters long');
  }

  // Prevent admin registration completely through public endpoints
  if (accountRole === 'admin' && config.nodeEnv !== 'test') {
    throw new ForbiddenError('Admin accounts cannot be registered publicly');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError('Email already in use');
  }

  // Normalize role: only student or recruiter allowed for self-registration in non-test environments
  let role = accountRole || 'student';
  if (config.nodeEnv !== 'test') {
    if (role === 'employee') role = 'student';
    if (role === 'manager') role = 'recruiter';
    if (!['student', 'recruiter'].includes(role)) {
      role = 'student';
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    accountRole: role,
    company: company || '',
    phone: phone || '',
    department: department || '',
    branch: branch || '',
    college: college || '',
    yearOfStudy: yearOfStudy || ''
  });

  const { accessToken, refreshToken } = await generateTokens(user, req);

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    token: accessToken,
    accessToken,
    refreshToken
  };
};

const login = async (email, password, req) => {
  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  if (user.isActive === false) {
    throw new ForbiddenError('Your account has been deactivated. Please contact the administrator.');
  }

  const { accessToken, refreshToken } = await generateTokens(user, req);

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    token: accessToken,
    accessToken,
    refreshToken
  };
};

const rotateRefreshToken = async (oldRefreshToken, req) => {
  if (!oldRefreshToken) {
    throw new UnauthorizedError('Refresh token required');
  }

  const oldHash = hashToken(oldRefreshToken);
  const tokenDoc = await AuthToken.findOne({ tokenHash: oldHash });

  if (!tokenDoc) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Token reuse compromise detection:
  // If an already revoked token is used, revoke ALL tokens for this user!
  if (tokenDoc.revoked) {
    await AuthToken.updateMany({ userId: tokenDoc.userId }, { revoked: true });
    throw new UnauthorizedError('Token reuse detected. All active sessions have been revoked for security. Please log in again.');
  }

  // Check expiration
  if (new Date() > tokenDoc.expiresAt) {
    throw new UnauthorizedError('Refresh token expired. Please log in again.');
  }

  // Revoke the old token
  tokenDoc.revoked = true;
  await tokenDoc.save();

  // Load user
  const user = await User.findById(tokenDoc.userId).populate('targetRoleId');
  if (!user) {
    throw new UnauthorizedError('The user belonging to this token no longer exists.');
  }

  // Issue new pair
  const { accessToken, refreshToken } = await generateTokens(user, req);

  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    user: userResponse,
    token: accessToken,
    accessToken,
    refreshToken
  };
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    const hash = hashToken(refreshToken);
    await AuthToken.updateOne({ tokenHash: hash }, { revoked: true });
  }
  return { success: true };
};

const forgotPassword = async (email) => {
  if (!email) {
    throw new BadRequestError('Please provide an email address');
  }

  const user = await User.findOne({ email });
  if (!user) {
    // Return standard response to avoid user email enumeration
    return {
      success: true,
      message: 'If an account exists with that email, a password reset link has been dispatched.'
    };
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = hashToken(rawResetToken);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await user.save({ validateBeforeSave: false });

  return {
    success: true,
    message: 'If an account exists with that email, a password reset link has been dispatched.',
    resetToken: rawResetToken // Returned for testing & dev environments
  };
};

const resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw new BadRequestError('Reset token and new password are required');
  }

  if (newPassword.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters long');
  }

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new BadRequestError('Password reset token is invalid or has expired');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Invalidate all active sessions for this user on password reset
  await AuthToken.updateMany({ userId: user._id }, { revoked: true });

  return {
    success: true,
    message: 'Password reset successfully'
  };
};

module.exports = {
  register,
  login,
  rotateRefreshToken,
  logout,
  forgotPassword,
  resetPassword,
  generateToken,
  generateTokens,
  hashToken
};
