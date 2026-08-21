const authService = require('../services/authService');
const { catchAsync } = require('../utils/helpers');

const register = catchAsync(async (req, res, next) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    data: result
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json({
    success: true,
    data: result
  });
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
  me
};
