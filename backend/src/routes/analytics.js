const express = require('express');
const auth = require('../middleware/auth');
const {
  getSystemAnalytics,
  getFormAnalytics,
} = require('../controllers/analyticsController');

const router = express.Router();

// Get system-wide analytics (admin only)
router.get('/', auth('admin'), getSystemAnalytics);

// Get analytics for a specific form (admin only)
router.get('/forms/:formId', auth('admin'), getFormAnalytics);

module.exports = router;

