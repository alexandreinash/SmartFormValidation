const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { Op } = require('sequelize');
const { sequelize } = require('../sequelize');
const User = require('../models/User');
const Form = require('../models/Form');
const PasswordReset = require('../models/PasswordReset');
const { logAudit } = require('../services/auditLogger');
const { sendRegistrationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Initialize Google OAuth client
let googleClient = null;
if (process.env.GOOGLE_CLIENT_ID) {
  try {
    googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    console.log('[Google OAuth] Client initialized successfully');
    console.log('[Google OAuth] Client ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
    console.log('[Google OAuth] Note: Ensure this matches the frontend Google Client ID');
  } catch (err) {
    console.error('[Google OAuth] Failed to initialize client:', err);
  }
} else {
  console.warn('[Google OAuth] ⚠️  GOOGLE_CLIENT_ID not set in environment variables');
  console.warn('[Google OAuth] Google sign-in will not work until GOOGLE_CLIENT_ID is configured');
}

// Validation chains used by the routes
const validateRegister = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Email must be a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be either admin or user'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => {
        // Use the custom message if available, otherwise create a default one
        if (err.msg) {
          const fieldName = err.param ? err.param.charAt(0).toUpperCase() + err.param.slice(1) : '';
          return fieldName ? `${fieldName}: ${err.msg}` : err.msg;
        }
        return `${err.param || 'Field'}: Invalid value`;
      });
      
      console.log('[Register] Validation errors:', errors.array());
      console.log('[Register] Error message:', errorMessages.join('. '));
      
      return res.status(400).json({ 
        success: false, 
        message: errorMessages.join('. '),
        errors: errors.array() 
      });
    }

    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    
    let user;
    try {
      user = await User.create({ username, email, password: hashed, role });
    } catch (dbErr) {
      console.error('[Register] Database error:', dbErr);
      
      // Check if it's a column error (missing username column)
      if (dbErr.name === 'SequelizeDatabaseError' && 
          (dbErr.message && dbErr.message.includes('Unknown column') || 
           dbErr.message && dbErr.message.includes('username'))) {
        return res.status(500).json({
          success: false,
          message: 'Database schema error: username column is missing. Please run the migration script: add-username-column.sql'
        });
      }
      
      // Check if it's a duplicate entry error
      if (dbErr.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
      
      // Re-throw for other errors
      throw dbErr;
    }

    try {
      await logAudit({
        userId: user.id,
        action: 'user_registered',
        entityType: 'user',
        entityId: user.id,
      });
    } catch (auditErr) {
      // Don't fail registration if audit logging fails
      console.error('Failed to log audit:', auditErr);
    }

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
    console.error('[Register] Unexpected error:', err);
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg || err.message || 'Validation error').join('. ');
      return res.status(400).json({ 
        success: false, 
        message: errorMessages || 'Validation failed',
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
        .json({ success: false, message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password' });
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
      attributes: ['id', 'username', 'email', 'role', 'account_id', 'is_account_owner', 'created_at'],
      order: [['email', 'ASC']],
    });

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

// Delete users (admin only)
async function deleteUsers(req, res, next) {
  try {
    const { user_ids } = req.body;
    
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'user_ids array is required' 
      });
    }

    // Prevent deleting yourself
    if (user_ids.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Load users to be deleted
    const usersToDelete = await User.findAll({
      where: { id: { [Op.in]: user_ids } }
    });

    if (usersToDelete.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found to delete'
      });
    }

    // Check if any are account owners
    const accountOwners = usersToDelete.filter(u => u.is_account_owner);
    if (accountOwners.length > 0) {
      // Handle account owners - clear account associations
      await sequelize.transaction(async (tx) => {
        for (const owner of accountOwners) {
          // Clear account_id for users in this account
          await User.update(
            { account_id: null, is_account_owner: false },
            { where: { account_id: owner.id }, transaction: tx }
          );

          // Clear account_id for forms in this account
          await Form.update(
            { account_id: null },
            { where: { account_id: owner.id }, transaction: tx }
          );
        }

        // Delete the users
        await User.destroy({
          where: { id: { [Op.in]: user_ids } },
          transaction: tx
        });
      });
    } else {
      // Regular deletion (cascade will handle related records)
      await User.destroy({
        where: { id: { [Op.in]: user_ids } }
      });
    }

    // Log audit
    const { logAudit } = require('../services/auditLogger');
    await logAudit({
      userId: req.user.id,
      action: 'users_deleted',
      entityType: 'user',
      metadata: { deleted_count: usersToDelete.length, deleted_ids: user_ids }
    }).catch(err => console.error('Failed to log audit:', err));

    res.json({
      success: true,
      message: `Successfully deleted ${usersToDelete.length} user(s)`,
      data: { deleted: usersToDelete.length }
    });
  } catch (err) {
    console.error('Delete users error:', err);
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
      console.error('[Google OAuth] Client not initialized. GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'set' : 'not set');
      return res.status(500).json({ 
        success: false, 
        message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in environment variables.' 
      });
    }

    // Verify the Google token
    let ticket;
    try {
      // Try with the configured client ID first
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error('[Google OAuth] Token verification failed:', verifyErr);
      console.error('[Google OAuth] Error details:', {
        message: verifyErr.message,
        code: verifyErr.code,
        name: verifyErr.name
      });
      
      // If audience mismatch, try without strict audience check (for development)
      if (verifyErr.message && (
          verifyErr.message.includes('Wrong recipient') || 
          verifyErr.message.includes('audience') ||
          verifyErr.message.includes('Invalid token')
        )) {
        console.warn('[Google OAuth] Attempting verification without strict audience check...');
        try {
          ticket = await googleClient.verifyIdToken({
            idToken: credential,
            // Don't specify audience - let it verify against any allowed client
          });
          console.log('[Google OAuth] Token verified without strict audience check');
        } catch (retryErr) {
          console.error('[Google OAuth] Retry verification also failed:', retryErr);
          throw verifyErr; // Throw original error
        }
      } else {
        throw verifyErr; // Re-throw for other errors
      }
    }
    
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
    const isNewUser = !user;
    
    if (!user) {
      // For new Google users, create a temporary session token with verified email
      // This avoids re-verifying the Google token (which causes audience mismatch)
      const sessionToken = jwt.sign(
        { 
          email: email,
          googleId: googleId,
          type: 'google_role_selection',
          verified: true
        },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '10m' } // 10 minute expiry for role selection
      );
      
      return res.json({
        success: true,
        needsRoleSelection: true,
        email: email,
        sessionToken: sessionToken,
        message: 'Please select your role to complete registration',
      });
    }
    
    // Generate JWT token for existing users
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
      needsRoleSelection: false,
      data: { 
        token, 
        user: { id: user.id, email: user.email, role: user.role } 
      },
      message: 'Google login successful',
    });
  } catch (err) {
    console.error('Google login error:', err);
    console.error('Error details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    // Check if it's a database connection error
    if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection error. Please check if the database server is running.' 
      });
    }
    
    // Check if it's a Google token verification error
    if (err.message && (
        err.message.includes('Token used too early') || 
        err.message.includes('Wrong recipient') || 
        err.message.includes('audience') ||
        err.message.includes('Invalid token') ||
        err.message.includes('expired') ||
        err.code === 'auth/id-token-expired'
      )) {
      // Provide more helpful error message
      let errorMsg = 'Invalid or expired Google token. Please sign in again.';
      
      if (err.message.includes('Wrong recipient') || err.message.includes('audience')) {
        errorMsg = 'Google Client ID mismatch. Please ensure the backend GOOGLE_CLIENT_ID matches the frontend client ID.';
        console.error('[Google OAuth] Client ID mismatch detected. Backend ID:', process.env.GOOGLE_CLIENT_ID);
      }
      
      return res.status(401).json({ 
        success: false, 
        message: errorMsg 
      });
    }
    
    // More specific error messages
    if (err.code === 'EAUTH' || err.message?.includes('authentication')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Google authentication failed. Please try again.' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: err.message || 'Google login failed. Please try again.' 
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

const validateGoogleRoleSelection = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['admin', 'user']).withMessage('Role must be either admin or user'),
  body('sessionToken').notEmpty().withMessage('Session token is required'),
];

// Complete Google login with role selection (for first-time users)
async function completeGoogleLogin(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, role, sessionToken } = req.body;
    
    // Verify the session token instead of re-verifying Google token
    let sessionPayload;
    try {
      sessionPayload = jwt.verify(sessionToken, process.env.JWT_SECRET || 'dev_secret');
    } catch (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired session token. Please sign in again.' 
      });
    }
    
    // Verify the session token is for role selection and email matches
    if (sessionPayload.type !== 'google_role_selection' || !sessionPayload.verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid session token type' 
      });
    }
    
    if (sessionPayload.email !== email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email mismatch' 
      });
    }
    
    // Check if user already exists (should not happen, but safety check)
    let user = await User.findOne({ where: { email } });
    
    if (user) {
      // User already exists, proceed with normal login
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '8h' }
      );
      
      return res.json({
        success: true,
        data: { 
          token, 
          user: { id: user.id, email: user.email, role: user.role } 
        },
        message: 'Google login successful',
      });
    }
    
    // Create new user with selected role
    const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);
    // Generate username from email (take part before @)
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 8);
    
    user = await User.create({ 
      email,
      username,
      password: randomPassword,
      role: role
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
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '8h' }
    );
    
    return res.json({
      success: true,
      data: { 
        token, 
        user: { id: user.id, email: user.email, role: user.role } 
      },
      message: 'Registration successful',
    });
  } catch (err) {
    console.error('Complete Google login error:', err);
    next(err);
  }
}

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGoogleRoleSelection,
  register,
  login,
  listUsers,
  deleteUsers,
  googleLogin,
  completeGoogleLogin,
  forgotPassword,
  resetPassword,
  validateResetToken,
};




