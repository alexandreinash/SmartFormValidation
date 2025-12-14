const User = require('../models/User');
const Form = require('../models/Form');
const { sequelize } = require('../sequelize');

// Get account members (for account owner)
async function getAccountMembers(req, res, next) {
  try {
    const tokenUser = req.user;
    if (!tokenUser) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    // Load full user record to get account fields
    const user = await User.findByPk(tokenUser.id);
    if (!user) return res.status(401).json({ success: false, error: { message: 'User not found' } });

    if (!user.is_account_owner) {
      return res.status(403).json({ success: false, error: { message: 'Only account owners can view account members' } });
    }

    // Get all members of this account
    // Members have account_id = owner.id, and owner might have account_id = their own id or null
    const { Op } = require('sequelize');
    const allMembers = await User.findAll({
      where: {
        [Op.or]: [
          { account_id: user.id },  // Regular members
          { id: user.id }            // The owner
        ]
      },
      attributes: ['id', 'email', 'username', 'is_account_owner'],
      order: [['is_account_owner', 'DESC'], ['email', 'ASC']],
    });

    return res.json({ 
      success: true, 
      data: allMembers,
      message: `Found ${allMembers.length} account member(s)`
    });
  } catch (err) {
    next(err);
  }
}

// Remove or leave account
// - If account owner: disband account (clear account_id on users and forms)
// - If regular user: leave account (clear their account_id)
async function removeAccount(req, res, next) {
  try {
    const tokenUser = req.user;
    if (!tokenUser) return res.status(401).json({ success: false, error: { message: 'Authentication required' } });

    // Load full user record to get account fields
    const user = await User.findByPk(tokenUser.id);
    if (!user) return res.status(401).json({ success: false, error: { message: 'User not found' } });

    const { confirm } = req.body || {};
    // Accept both 'confirm' and 'DELETE' for backward compatibility
    if (confirm !== 'confirm' && confirm !== 'DELETE') {
      return res.status(400).json({ success: false, error: { message: 'Confirmation text not provided or incorrect' } });
    }

    if (user.is_account_owner) {
      // Disband the account owned by this user
      await sequelize.transaction(async (tx) => {
        // Clear account_id and is_account_owner for all members of this account
        await User.update(
          { account_id: null, is_account_owner: false },
          { where: { account_id: user.id }, transaction: tx }
        );

        // Clear account_id for forms belonging to this account
        await Form.update(
          { account_id: null },
          { where: { account_id: user.id }, transaction: tx }
        );

        // Finally clear owner itself
        await User.update(
          { account_id: null, is_account_owner: false },
          { where: { id: user.id }, transaction: tx }
        );
      });

      return res.json({ success: true, message: 'Account disbanded and associations removed' });
    }

    // Regular user: just leave the account
    await User.update({ account_id: null }, { where: { id: user.id } });
    return res.json({ success: true, message: 'Left account successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAccountMembers,
  removeAccount,
};
