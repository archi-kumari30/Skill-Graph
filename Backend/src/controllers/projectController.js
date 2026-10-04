const Project = require('../models/Project');
const DailyActivity = require('../models/DailyActivity');
const { catchAsync } = require('../utils/helpers');
const { NotFoundError, BadRequestError } = require('../utils/customErrors');

// Get current user's projects
const getMyProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ userId: req.user._id })
    .populate('skillsUsed', 'name category')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: projects
  });
});

// Create new project
const createProject = catchAsync(async (req, res, next) => {
  const { title, description, technologies, skillsUsed, githubUrl, liveUrl, difficulty, highlights } = req.body;

  if (!title || !description) {
    throw new BadRequestError('Project title and description are required');
  }

  const project = await Project.create({
    userId: req.user._id,
    title,
    description,
    technologies: Array.isArray(technologies) ? technologies : (technologies ? technologies.split(',').map(s => s.trim()) : []),
    skillsUsed: Array.isArray(skillsUsed) ? skillsUsed : [],
    githubUrl: githubUrl || '',
    liveUrl: liveUrl || '',
    difficulty: difficulty || 'intermediate',
    highlights: Array.isArray(highlights) ? highlights : []
  });

  await project.populate('skillsUsed', 'name category');

  // Log Daily Activity
  const today = new Date().toISOString().split('T')[0];
  await DailyActivity.create({
    userId: req.user._id,
    date: today,
    activityType: 'project_added',
    title: `Added project: ${title}`,
    details: description.slice(0, 100),
    minutesSpent: 45
  });

  res.status(201).json({
    success: true,
    data: project
  });
});

// Update project
const updateProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const allowedFields = ['title', 'description', 'technologies', 'skillsUsed', 'githubUrl', 'liveUrl', 'difficulty', 'highlights'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'technologies' && typeof req.body[field] === 'string') {
        project[field] = req.body[field].split(',').map(s => s.trim());
      } else {
        project[field] = req.body[field];
      }
    }
  });

  await project.save();
  await project.populate('skillsUsed', 'name category');

  res.status(200).json({
    success: true,
    data: project
  });
});

// Delete project
const deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully'
  });
});

module.exports = {
  getMyProjects,
  createProject,
  updateProject,
  deleteProject
};
