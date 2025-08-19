const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const passport = require('passport');

exports.register = async (req, res) => {
  try {
    const { user: userData, tenant: tenantData } = req.body;

    if (!userData || !tenantData) {
      return res.status(400).json({
        success: false,
        message: 'User and tenant data are required'
      });
    }

    const { name, email, password } = userData;
    const { name: tenantName, slug: tenantSlug } = tenantData;

    // First, create the tenant
    const tenant = await Tenant.create({
      name: tenantName,
      slug: tenantSlug
    });

    let user = await User.findOne({ email, tenantId: tenant._id });
    if (user) {
      await Tenant.findByIdAndDelete(tenant._id);
      
      return res.status(400).json({
        success: false,
        message: 'User already exists in this organization'
      });
    }

    // Create user
    user = await User.create({
      name,
      email,
      password,
      tenantId: tenant._id,
      role: 'admin'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password and tenant ID'
      });
    }

    const user = await User.findOne({ email, tenantId }).select('+password');

    if (!user) {
      console.log(`Login failed: User not found with email ${email} and tenantId ${tenantId}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - user not found'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log(`Login failed: Password mismatch for user ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - password mismatch'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // user is already available in req due to the protect middleware
    const user = await User.findById(req.user.id);

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

// @desc    Update user details
// @route   PUT /api/auth/update
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

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

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Logout user / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  // Clear token cookie
  res.clearCookie('token', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict'
  });
  
  // Clear tenantId cookie
  res.clearCookie('tenantId', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict'
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  });
};

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
exports.googleAuthCallback = (req, res) => {
  // User is already authenticated by passport
  const user = req.user;
  sendTokenResponse(user, 200, res);
};

// @desc    Invite user to tenant
// @route   POST /api/auth/invite
// @access  Private (Admin only)
exports.inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email'
      });
    }
    
    // Check if req.user and req.user.tenantId exist
    if (!req.user || !req.user.tenantId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication error: Missing tenant information'
      });
    }

    // Check if user already exists in any tenant
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If user exists in current tenant
      if (existingUser.tenantId.toString() === req.user.tenantId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'User already exists in this organization'
        });
      } else {
        // User exists in another tenant, we need to handle this specially
        return res.status(400).json({
          success: false,
          message: 'This email is already registered in another organization. Please use a different email.'
        });
      }
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(20).toString('hex');
    
    // Create temporary password - this will be hashed by the User model's pre-save hook
    const tempPassword = crypto.randomBytes(8).toString('hex');
    
    // Create new user with temporary password
    const newUser = await User.create({
      email,
      name: email.split('@')[0], // Use part of email as name initially
      password: tempPassword, // Model's pre-save hook will hash this
      role: role || 'team_member',
      tenantId: req.user.tenantId
    });

    // Get tenant info
    const tenant = await Tenant.findById(req.user.tenantId);

    if (!tenant) {
      // Delete the created user to avoid orphaned users
      await User.findByIdAndDelete(newUser._id);
      
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Send email with temporary login credentials and direct login link with params
    const message = `
      You've been invited to join ${tenant.name} on our Project Management platform.
      Your temporary login credentials are:
      
      Email: ${email}
      Password: ${tempPassword}
      
      Please login and change your password immediately.
      ${process.env.CLIENT_URL}/login?email=${encodeURIComponent(email)}&tenantId=${req.user.tenantId}
    `;

    await sendEmail({
      email,
      subject: `Invitation to join ${tenant.name}`,
      message
    });

    // Add a status field to indicate this is an invited user
    newUser.status = 'Invited';
    await newUser.save();

    // Return the user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: userResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Helper method to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  // First, clear any existing cookies
  res.clearCookie('token', { path: '/' });
  res.clearCookie('tenantId', { path: '/' });

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    path: '/',
    sameSite: 'lax'  // Change to lax to allow cross-site requests
  };

  // Use secure flag in production
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .cookie('tenantId', user.tenantId, options)
    .json({
      success: true,
      token,
      user
    });
};

// @desc    OAuth success handler
// @route   GET /api/v1/auth/oauth/success
// @access  Private
exports.oauthSuccess = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=Authentication failed`);
    }

    // Create JWT token for the authenticated user
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    // First, clear any existing cookies
    res.clearCookie('token');
    res.clearCookie('tenantId');

    // Set cookie options
    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      path: '/',
      sameSite: 'strict' // Enhance cookie security
    };

    // Use secure flag in production
    if (process.env.NODE_ENV === 'production') {
      options.secure = true;
    }

    // Set cookies and redirect to dashboard
    res
      .cookie('token', token, options)
      .cookie('tenantId', req.user.tenantId, options)
      .redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error('OAuth success handler error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=Server error`);
  }
};
