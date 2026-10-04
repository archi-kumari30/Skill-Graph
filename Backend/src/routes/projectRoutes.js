const express = require('express');
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All project routes require authentication

router.route('/')
  .get(projectController.getMyProjects)
  .post(projectController.createProject);

router.route('/:id')
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

module.exports = router;
