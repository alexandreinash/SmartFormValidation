const express = require('express');
const auth = require('../middleware/auth');
const {
  listUsers,
  googleLogin,
  validateGoogleRoleSelection,
  completeGoogleLogin,
  deleteUsers,
  testEmail,
} = require('../controllers/authController');

const router = express.Router();

function rejectPasswordAuth(req, res) {
  return res.status(403).json({
    success: false,
    message: 'Password-based authentication is disabled. Sign in with your approved university Google account instead.',
  });
}

// Auth routes delegate to controller functions
router.post('/register', rejectPasswordAuth);
router.post('/login', rejectPasswordAuth);
router.post('/google-login', googleLogin);
router.post('/google-login/complete', validateGoogleRoleSelection, completeGoogleLogin);
router.post('/forgot-password', rejectPasswordAuth);
router.post('/reset-password', rejectPasswordAuth);
router.get('/validate-reset-token/:token', rejectPasswordAuth);
router.get('/users', auth('admin'), listUsers);
router.delete('/users', auth('admin'), deleteUsers);
router.post('/test-email', auth('admin'), testEmail);

module.exports = router;


