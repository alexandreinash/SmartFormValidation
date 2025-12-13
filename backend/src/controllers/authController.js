const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { logAudit } = require('../services/auditLogger');
const { sendRegistrationEmail } = require('../services/emailService');

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

module.exports = {
  validateRegister,
  validateLogin,
  register,
  login,
  listUsers,
  googleLogin,
};




