const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { logAudit } = require('../services/auditLogger');
const { sendRegistrationEmail, sendPasswordResetEmail } = require('../services/emailService');

const googleClient = process.env.GOOGLE_CLIENT_ID 
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

// Validation chains used by the routes
const validateRegister = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'user']),
];

const validateLogin = [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
];

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed, role });

    await logAudit({
      userId: user.id,
      action: 'user_registered',
      entityType: 'user',
      entityId: user.id,
    });

    // Send registration email (non-blocking)
    sendRegistrationEmail(user.email, user.role).catch((err) => {
      console.error('Failed to send registration email:', err);
    });

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      success: true,
      data: { 
        token, 
        user: { id: user.id, email: user.email, role: user.role } 
      },
      message: 'Registration successful',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role } },
      message: 'Login successful',
    });

    // Log audit asynchronously, don't wait for it
    logAudit({
      userId: user.id,
      action: 'user_logged_in',
      entityType: 'user',
      entityId: user.id,
    }).catch((err) => {
      console.error('Failed to log audit:', err);
    });
  } catch (err) {
    console.error('Login error:', err);
    // Check if it's a database connection error
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error. Please check if the database server is running.' 
      });
    }
    next(err);
  }
}

// Get all users (for admin - to see available end-users)
async function listUsers(req, res, next) {
  try {
    const { role } = req.query;
    
    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'email', 'role', 'created_at'],
      order: [['email', 'ASC']],
    });

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

// Google OAuth Login
async function googleLogin(req, res, next) {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: 'Google credential is required' 
      });
    }

    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ 
        success: false, 
        message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in environment variables.' 
      });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not found in Google account' 
      });
    }
    
    // Check if user exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create new user with random password (since they're using Google OAuth)
      const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({ 
        email, 
        password: randomPassword,
        role: 'user' // Default role for Google sign-in users
      });
      
      logAudit({
        userId: user.id,
        action: 'user_registered_google',
        entityType: 'user',
        entityId: user.id,
      }).catch((err) => {
        console.error('Failed to log audit:', err);
      });
      
      // Send registration email (non-blocking)
      sendRegistrationEmail(user.email, user.role).catch((err) => {
        console.error('Failed to send registration email:', err);
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '8h' }
    );
    
    logAudit({
      userId: user.id,
      action: 'user_logged_in_google',
      entityType: 'user',
      entityId: user.id,
    }).catch((err) => {
      console.error('Failed to log audit:', err);
    });
    
    return res.json({
      success: true,
      data: { 
        token, 
        user: { id: user.id, email: user.email, role: user.role } 
      },
      message: 'Google login successful',
    });
  } catch (err) {
    console.error('Google login error:', err);
    
    // Check if it's a database connection error
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error. Please check if the database server is running.' 
      });
    }
    
    // Check if it's a Google token verification error
    if (err.message && err.message.includes('Token used too early')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid Google token. Please try again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: err.message || 'Invalid Google credential. Please try again.' 
    });
  }
}

// Forgot password - request password reset
async function forgotPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email } = req.body;
    
    // Return success immediately for fast response (security best practice - prevents email enumeration)
    res.json({
      success: true,
      message: 'Password reset link has been sent to your email.',
    });
    
    // Process password reset in background (non-blocking)
    (async () => {
      try {
        // Find user by email
        const user = await User.findOne({ where: { email } });
        
        // Only send email if user exists
        if (user) {
          // Generate reset token
          const token = crypto.randomBytes(32).toString('hex');
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
          
          // Invalidate any existing reset tokens for this user
          await PasswordReset.update(
            { used: true },
            { where: { user_id: user.id, used: false } }
          );
          
          // Create new reset token
          await PasswordReset.create({
            user_id: user.id,
            token,
            expires_at: expiresAt,
            used: false,
          });
          
          // Send password reset email (non-blocking)
          const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${token}`;
          sendPasswordResetEmail(user.email, resetUrl).then((emailResult) => {
            if (!emailResult.success) {
              console.error('[Password Reset] ❌ Failed to send email to:', user.email);
              console.error('[Password Reset] Error:', emailResult.message);
              console.error('[Password Reset] Error Code:', emailResult.errorCode || 'N/A');
              
              // Log detailed error for debugging
              if (process.env.EMAIL_ENABLED !== 'true') {
                console.error('[Password Reset] ⚠️  Email service is DISABLED.');
                console.error('[Password Reset] Fix: Set EMAIL_ENABLED=true in your .env file');
              }
              if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
                console.error('[Password Reset] ⚠️  SMTP credentials NOT configured.');
                console.error('[Password Reset] Fix: Set SMTP_USER and SMTP_PASS in your .env file');
                console.error('[Password Reset] For Gmail: Use an App Password (not your regular password)');
                console.error('[Password Reset] Get App Password: https://myaccount.google.com/apppasswords');
              }
            } else {
              console.log('[Password Reset] ✅ Email sent successfully to:', user.email);
            }
          }).catch((err) => {
            console.error('[Password Reset] ❌ Error sending email:', err);
          });
          
          // Log audit asynchronously (non-blocking)
          logAudit({
            userId: user.id,
            action: 'password_reset_requested',
            entityType: 'user',
            entityId: user.id,
          }).catch((err) => {
            console.error('Failed to log audit:', err);
          });
        }
      } catch (err) {
        console.error('[Password Reset] Background processing error:', err);
      }
    })();
  } catch (err) {
    console.error('Forgot password error:', err);
    next(err);
  }
}

// Reset password - with token
async function resetPassword(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { token, password } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token is required' 
      });
    }
    
    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      where: {
        token,
        used: false,
      },
      include: [{ model: User, as: 'user' }],
    });
    
    if (!resetRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }
    
    // Check if token has expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      await resetRecord.update({ used: true });
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired. Please request a new one.' 
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user password
    await User.update(
      { password: hashedPassword },
      { where: { id: resetRecord.user_id } }
    );
    
    // Mark token as used
    await resetRecord.update({ used: true });
    
    await logAudit({
      userId: resetRecord.user_id,
      action: 'password_reset_completed',
      entityType: 'user',
      entityId: resetRecord.user_id,
    });
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    next(err);
  }
}

// Validate reset token (for frontend to check if token is valid)
async function validateResetToken(req, res, next) {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      });
    }
    
    const resetRecord = await PasswordReset.findOne({
      where: {
        token,
        used: false,
      },
    });
    
    if (!resetRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired token',
        valid: false
      });
    }
    
    // Check if token has expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token has expired',
        valid: false
      });
    }
    
    res.json({
      success: true,
      message: 'Token is valid',
      valid: true
    });
  } catch (err) {
    console.error('Validate token error:', err);
    next(err);
  }
}

const validateForgotPassword = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  register,
  login,
  listUsers,
  googleLogin,
  forgotPassword,
  resetPassword,
  validateResetToken,
};




