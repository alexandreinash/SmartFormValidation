const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  validateCreateGroup,
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  addMembers,
  removeMembers,
  getAvailableUsers,
} = require('../controllers/groupController');

// All group routes require admin authentication
router.post('/', auth('admin'), validateCreateGroup, createGroup);
router.get('/', auth('admin'), listGroups);
router.get('/:id', auth('admin'), getGroup);
router.put('/:id', auth('admin'), validateCreateGroup, updateGroup);
router.delete('/:id', auth('admin'), deleteGroup);
router.post('/:id/members', auth('admin'), addMembers);
router.delete('/:id/members', auth('admin'), removeMembers);
router.get('/:id/available-users', auth('admin'), getAvailableUsers);

module.exports = router;
