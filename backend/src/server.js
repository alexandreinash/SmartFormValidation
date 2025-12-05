require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');

const { sequelize } = require('./sequelize');
const { apiLimiter, authLimiter, submissionLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');
const submissionRoutes = require('./routes/submissions');
const analyticsRoutes = require('./routes/analytics');
const auditRoutes = require('./routes/audit');

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

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
    },
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
  .sync()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Smart Form Validator API listening on port ${PORT}`);
      console.log(`WebSocket server ready for real-time updates`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });


