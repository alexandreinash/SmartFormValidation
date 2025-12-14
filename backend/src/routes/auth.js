const express = require('express');
const auth = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateGoogleRoleSelection,
  register,
  login,
  listUsers,
  googleLogin,
  completeGoogleLogin,
  forgotPassword,
  resetPassword,
  validateResetToken,
} = require('../controllers/authController');

const router = express.Router();

// Auth routes delegate to controller functions
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/google-login', googleLogin);
router.post('/google-login/complete', validateGoogleRoleSelection, completeGoogleLogin);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.get('/users', auth('admin'), listUsers);

module.exports = router;


