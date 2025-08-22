const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationController');

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
  .get(getNotifications);

router.post('/read', markAsRead);
router.post('/read-all', markAllAsRead);

router.delete('/clear-all', clearAllNotifications);

router.route('/:id')
  .delete(deleteNotification);

module.exports = router;
