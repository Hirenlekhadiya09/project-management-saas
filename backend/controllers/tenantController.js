const Tenant = require('../models/Tenant');

// @desc    Get all tenants
// @route   GET /api/v1/tenants
// @access  Public
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find();

    res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
