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
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE
    });

    // Send both cookies and URL parameters for maximum compatibility
    const cookieOptions = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    };
    
    if (process.env.NODE_ENV === 'production' && process.env.COOKIE_DOMAIN) {
      cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }

    // Set cookies
    res.cookie('auth_token', token, cookieOptions);
    res.cookie('auth_tenant', req.user.tenantId, cookieOptions);
    
    // Store full user object in cookie
    const userForCookie = {
      id: req.user.id,
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'user',
      tenantId: req.user.tenantId
    };
    
    res.cookie('auth_user', JSON.stringify(userForCookie), cookieOptions);
    
    // Also send as URL parameters as a fallback
    res.redirect(`${process.env.CLIENT_URL}/dashboard?token=${token}&tenantId=${req.user.tenantId}&userId=${req.user.id}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&role=${req.user.role || 'user'}&googleAuth=true`);
  }
);



module.exports = router;
