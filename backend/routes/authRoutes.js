const express = require('express');
const { register, login, getMe, logout, updateDetails, updatePassword, inviteUser } = require('../controllers/authController');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const { checkTenant } = require('../middleware/tenant');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimit');
const passport = require('passport');

// Routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);
router.put('/update', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Admin only routes
router.post('/invite', protect, checkTenant, authorize('admin', 'project_manager'), inviteUser);

// OAuth routes
// @route   GET api/v1/auth/google
// @desc    Auth with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET api/v1/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: process.env.CLIENT_URL + '/login?error=Google authentication failed' }), 
  (req, res) => {
    // Create and set token cookies
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    const options = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: true, 
      sameSite: 'none', 
      domain: process.env.COOKIE_DOMAIN || undefined 
    };

    // Add non-httpOnly cookies for frontend access in cross-domain scenarios
    const clientSideCookieOptions = {
      ...options,
      httpOnly: false
    };

    // Redirect to frontend with both httpOnly and non-httpOnly cookies, plus URL parameters as fallback
    res
      .cookie('token', token, options) // HTTP-only for security
      .cookie('tenantId', req.user.tenantId, options)
      .cookie('auth_token', token, clientSideCookieOptions) // Client-accessible for cross-domain issues
      .cookie('auth_tenant', req.user.tenantId, clientSideCookieOptions)
      .redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}&tenantId=${req.user.tenantId}&userId=${req.user.id}`);
  }
);



module.exports = router;
