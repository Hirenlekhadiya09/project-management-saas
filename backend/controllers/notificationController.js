const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const query = {
      recipient: req.user.id,
      tenantId: req.user.tenantId
    };

    // Filter by read status if specified
    if (req.query.read === 'true') {
      query.read = true;
    } else if (req.query.read === 'false') {
      query.read = false;
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const startIndex = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate({ path: 'sender', select: 'name email avatar' })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get count of unread notifications
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      tenantId: req.user.tenantId,
      read: false
    });

    // Get total count for pagination
    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark notifications as read
// @route   POST /api/notifications/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide notification IDs as an array'
      });
    }

    // Update notifications that belong to the current user
    const result = await Notification.updateMany(
      {
        _id: { $in: ids },
        recipient: req.user.id,
        tenantId: req.user.tenantId
      },
      { read: true }
    );

    res.status(200).json({
      success: true,
      count: result.modifiedCount,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   POST /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    // Update all unread notifications for the current user
    const result = await Notification.updateMany(
      {
        recipient: req.user.id,
        tenantId: req.user.tenantId,
        read: false
      },
      { read: true }
    );

    res.status(200).json({
      success: true,
      count: result.modifiedCount,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id,
      tenantId: req.user.tenantId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
