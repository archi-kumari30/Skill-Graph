const adminService = require('../services/adminService');
const { catchAsync } = require('../utils/helpers');

const getPlatformStats = catchAsync(async (req, res, next) => {
  const stats = await adminService.getPlatformStats();
  res.status(200).json({
    success: true,
    data: stats
  });
});

const getStudentsList = catchAsync(async (req, res, next) => {
  const students = await adminService.getStudentsList();
  res.status(200).json({
    success: true,
    data: students
  });
});

const getRecruitersList = catchAsync(async (req, res, next) => {
  const recruiters = await adminService.getRecruitersList();
  res.status(200).json({
    success: true,
    data: recruiters
  });
});

const toggleUserStatus = catchAsync(async (req, res, next) => {
  const { isActive } = req.body;
  const user = await adminService.toggleUserStatus(req.user._id, req.params.id, isActive);
  res.status(200).json({
    success: true,
    message: `User account has been ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      userId: user._id,
      isActive: user.isActive
    }
  });
});

const getStudentDetails = catchAsync(async (req, res, next) => {
  const details = await adminService.getStudentDetails(req.params.id);
  res.status(200).json({
    success: true,
    data: details
  });
});

module.exports = {
  getPlatformStats,
  getStudentsList,
  getRecruitersList,
  toggleUserStatus,
  getStudentDetails
};
