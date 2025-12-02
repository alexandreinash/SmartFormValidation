require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { sequelize } = require('./sequelize');
const authRoutes = require('./routes/auth');
const formRoutes = require('./routes/forms');
const submissionRoutes = require('./routes/submissions');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Smart Form Validator API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/submissions', submissionRoutes);

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

// Use a non-common default port to avoid conflicts with other local services.
const PORT = process.env.PORT || 5000;

// Note: using plain `.sync()` to avoid ALTER TABLE deadlocks on existing schemas.
sequelize
  .sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Smart Form Validator API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });


