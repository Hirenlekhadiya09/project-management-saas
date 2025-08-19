const express = require('express');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  addComment
} = require('../controllers/taskController');

const router = express.Router();

// Import middleware
const { protect } = require('../middleware/auth');
const { checkTenant } = require('../middleware/tenant');
const { apiLimiter } = require('../middleware/rateLimit');

// Apply middleware to all routes
router.use(protect);
router.use(checkTenant);
router.use(apiLimiter);

// Routes
router.route('/')
  .post(createTask)
  .get(getTasks);

router.route('/:id')
  .get(getTask)
  .put(updateTask)
  .delete(deleteTask);

// Comments routes
router.post('/:id/comments', addComment);

module.exports = router;
