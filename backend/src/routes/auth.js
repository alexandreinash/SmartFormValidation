const express = require('express');
const auth = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  register,
  login,
  listUsers,
} = require('../controllers/authController');

const router = express.Router();

// Auth routes delegate to controller functions
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/users', auth('admin'), listUsers);

module.exports = router;


