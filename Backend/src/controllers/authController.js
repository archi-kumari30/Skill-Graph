const authService = require('../services/authService');
const config = require('../config/config');
const { catchAsync } = require('../utils/helpers');

const COOKIE_NAME = 'skillgraph_rf';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

const register = catchAsync(async (req, res, next) => {
  const result = await authService.register(req.body, req);
  res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: result.user,
      token: result.accessToken,
      accessToken: result.accessToken
    }
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, req);
  res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: result.user,
      token: result.accessToken,
      accessToken: result.accessToken
    }
  });
});

const refreshToken = catchAsync(async (req, res, next) => {
  const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
  const result = await authService.rotateRefreshToken(rawRefreshToken, req);
  res.cookie(COOKIE_NAME, result.refreshToken, getCookieOptions());
  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      user: result.user,
      token: result.accessToken,
      accessToken: result.accessToken
    }
  });
});

const logout = catchAsync(async (req, res, next) => {
  const rawRefreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refreshToken;
  await authService.logout(rawRefreshToken);
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/'
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

const forgotPassword = catchAsync(async (req, res, next) => {
  const result = await authService.forgotPassword(req.body?.email);
  res.status(200).json({
    success: true,
    message: result.message,
    ...(result.resetToken && { resetToken: result.resetToken })
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const token = req.params.token || req.body?.token;
  const password = req.body?.password;
  const result = await authService.resetPassword(token, password);
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/'
  });
  res.status(200).json(result);
});

const me = catchAsync(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  me,
  COOKIE_NAME,
  getCookieOptions
};
