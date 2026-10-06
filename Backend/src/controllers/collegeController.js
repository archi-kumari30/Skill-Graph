const collegeService = require('../services/collegeService');
const { catchAsync } = require('../utils/helpers');

const getColleges = catchAsync(async (req, res, next) => {
  const colleges = await collegeService.getAllColleges(req.query);
  res.status(200).json({
    success: true,
    data: { colleges }
  });
});

const getCollege = catchAsync(async (req, res, next) => {
  const college = await collegeService.getCollegeById(req.params.id);
  res.status(200).json({
    success: true,
    data: { college }
  });
});

const createCollege = catchAsync(async (req, res, next) => {
  const college = await collegeService.createCollege(req.body);
  res.status(201).json({
    success: true,
    message: 'College registered successfully',
    data: { college }
  });
});

const updateCollegeStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const college = await collegeService.updateCollegeStatus(req.params.id, status);
  res.status(200).json({
    success: true,
    message: `College status updated to ${status}`,
    data: { college }
  });
});

const deleteCollege = catchAsync(async (req, res, next) => {
  const result = await collegeService.deleteCollege(req.params.id);
  res.status(200).json({
    success: true,
    message: result.message,
    data: null
  });
});

module.exports = {
  getColleges,
  getCollege,
  createCollege,
  updateCollegeStatus,
  deleteCollege
};
