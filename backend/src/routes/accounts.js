const express = require('express');
const router = express.Router();
const { removeAccount } = require('../controllers/accountController');
const auth = require('../middleware/auth');

// Remove or leave account
router.delete('/remove', auth(), removeAccount);

module.exports = router;
