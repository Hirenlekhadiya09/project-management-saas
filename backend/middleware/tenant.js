const Tenant = require('../models/Tenant');

// Middleware to check if the tenant exists and is active
exports.checkTenant = async (req, res, next) => {
  // Get tenant from header, cookie, or user object
  let tenantId = null;
  
  if (req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'];
  } else if (req.cookies.tenantId) {
    tenantId = req.cookies.tenantId;
  } else if (req.user && req.user.tenantId) {
    tenantId = req.user.tenantId;
  }

  if (!tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Tenant ID is required'
    });
  }

  try {
    // Check if tenant exists
    const tenant = await Tenant.findById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check if tenant is active
    if (!tenant.active) {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is inactive or suspended'
      });
    }

    // Add tenant to request object
    req.tenant = tenant;
    req.tenantId = tenant._id;
    
    // Also make sure the user object has the tenant ID properly set
    if (req.user && !req.user.tenantId) {
      req.user.tenantId = tenant._id;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking tenant',
      error: error.message
    });
  }
};
