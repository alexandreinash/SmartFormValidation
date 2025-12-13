const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { logAudit } = require('../services/auditLogger');
const { sendRegistrationEmail } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation chains used by the routes
const validateRegister = [
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

    const { email, password, role } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, role });

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
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
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

    await logAudit({
      userId: user.id,
      action: 'user_logged_in',
      entityType: 'user',
      entityId: user.id,
    });
  } catch (err) {
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

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;
    
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
      
      await logAudit({
        userId: user.id,
        action: 'user_registered_google',
        entityType: 'user',
        entityId: user.id,
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
    
    await logAudit({
      userId: user.id,
      action: 'user_logged_in_google',
      entityType: 'user',
      entityId: user.id,
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
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid Google credential' 
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




