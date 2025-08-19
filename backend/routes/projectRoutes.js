const express = require('express');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { checkTenant } = require('../middleware/tenant');
const { apiLimiter } = require('../middleware/rateLimit');

// Apply middleware to all routes
router.use(protect);
router.use(checkTenant);
router.use(apiLimiter);

// Routes
router.route('/')
  .post(authorize('admin', 'project_manager'), createProject)
  .get(getProjects);

router.route('/:id')
  .get(getProject)
  .put(authorize('admin', 'project_manager'), updateProject)
  .delete(authorize('admin', 'project_manager'), deleteProject);

module.exports = router;
