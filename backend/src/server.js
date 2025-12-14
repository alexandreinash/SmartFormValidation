require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');

const { sequelize } = require('./sequelize');
// Load all models to ensure relationships are defined before sync
const User = require('./models/User');
const Form = require('./models/Form');
const FormField = require('./models/FormField');
const Submission = require('./models/Submission');
const SubmissionData = require('./models/SubmissionData');
const AuditLog = require('./models/AuditLog');
const Group = require('./models/Group');
const GroupMember = require('./models/GroupMember');

// Define associations
Group.hasMany(GroupMember, { foreignKey: 'group_id', as: 'memberships' });
GroupMember.belongsTo(Group, { foreignKey: 'group_id', as: 'group' });
GroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(GroupMember, { foreignKey: 'user_id', as: 'group_memberships' });

const { apiLimiter, authLimiter, submissionLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');
const submissionRoutes = require('./routes/submissions');
const analyticsRoutes = require('./routes/analytics');
const auditRoutes = require('./routes/audit');
const accountsRoutes = require('./routes/accounts');
const groupRoutes = require('./routes/groups');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS support
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Form Validator API is running' });
});

// Apply specific rate limiters to routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/submissions', submissionLimiter, submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/groups', groupRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join room for admin dashboard updates
  socket.on('join-admin-room', () => {
    socket.join('admin-room');
    console.log(`Client ${socket.id} joined admin room`);
  });

  // Join room for specific form updates
  socket.on('join-form-room', (formId) => {
    socket.join(`form-${formId}`);
    console.log(`Client ${socket.id} joined form room: form-${formId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io available to other modules
app.set('io', io);

// Use a non-common default port to avoid conflicts with other local services.
const PORT = process.env.PORT || 5000;

// Note: using plain `.sync()` to avoid ALTER TABLE deadlocks on existing schemas.
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
    
    // Display email service status
    console.log('\n=== Email Service Status ===');
    if (process.env.EMAIL_ENABLED === 'true') {
      console.log('✅ Email service: ENABLED');
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log(`✅ SMTP configured: ${process.env.SMTP_USER}`);
        console.log('   (Connection will be verified automatically)');
      } else {
        console.log('❌ SMTP credentials: NOT CONFIGURED');
        console.log('   Set SMTP_USER and SMTP_PASS in .env file');
        console.log('   See EMAIL_SETUP_GUIDE.md for instructions');
      }
    } else {
      console.log('❌ Email service: DISABLED');
      console.log('   Set EMAIL_ENABLED=true in .env file to enable');
      console.log('   Password reset emails will NOT be sent');
    }
    console.log('===========================\n');
    
    return sequelize.sync();
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Smart Form Validator API listening on port ${PORT}`);
      console.log(`WebSocket server ready for real-time updates`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });


