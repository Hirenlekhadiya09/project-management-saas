const User = require('../models/User');

// @desc    Get all users for a tenant
// @route   GET /api/v1/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/v1/users/:id
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    // Check if trying to update own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot update your own role'
      });
    }

    // Find the user to update
    let user = await User.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update the user role
    user.role = req.body.role;
    await user.save();

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res) => {
  try {
    // Check if trying to delete self
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    // Find the user to delete
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
