const express = require('express');
const auth = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  register,
  login,
  listUsers,
  googleLogin,
  forgotPassword,
  resetPassword,
  validateResetToken,
} = require('../controllers/authController');

const router = express.Router();

// Auth routes delegate to controller functions
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/google-login', googleLogin);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.get('/users', auth('admin'), listUsers);

module.exports = router;


