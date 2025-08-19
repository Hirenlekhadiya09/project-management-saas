const express = require('express');
const router = express.Router();

// Import controllers
const { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  deleteUser 
} = require('../controllers/userController');

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { checkTenant } = require('../middleware/tenant');
const { apiLimiter } = require('../middleware/rateLimit');

// Apply middleware to all routes
router.use(protect);
router.use(checkTenant);
router.use(apiLimiter);

// User routes
router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUserById)
  .put(authorize('admin'), updateUserRole)
  .delete(authorize('admin'), deleteUser);

module.exports = router;
