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

const PORT = process.env.PORT || 4000;

sequelize
  .sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Smart Form Validator API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });


