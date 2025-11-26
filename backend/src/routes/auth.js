const express = require('express');
const {
  validateRegister,
  validateLogin,
  register,
  login,
} = require('../controllers/authController');

const router = express.Router();

// Auth routes delegate to controller functions
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

module.exports = router;


