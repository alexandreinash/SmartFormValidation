const express = require('express');
const router = express.Router();
const { getAccountMembers, removeAccount } = require('../controllers/accountController');
const auth = require('../middleware/auth');

// Get account members (for account owner)
router.get('/members', auth(), getAccountMembers);

// Remove or leave account
router.delete('/remove', auth(), removeAccount);

module.exports = router;
