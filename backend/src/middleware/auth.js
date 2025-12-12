const jwt = require('jsonwebtoken');
const User = require('../models/User');

function auth(requiredRole) {
  return async (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    
    if (!token) {
      // If a specific role is required, return unauthorized
      if (requiredRole) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      // Otherwise, allow anonymous access and continue
      req.user = null;
      return next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      if (requiredRole && payload.role !== requiredRole) {
        return res
          .status(403)
          .json({ success: false, message: 'Forbidden: insufficient role' });
      }
      // Enrich payload with account fields so downstream access control works
      try {
        const dbUser = await User.findByPk(payload.id);
        req.user = {
          id: payload.id,
          role: payload.role,
          account_id: dbUser ? dbUser.account_id : null,
          is_account_owner: dbUser ? !!dbUser.is_account_owner : false,
        };
      } catch (e) {
        req.user = payload;
      }
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
}

module.exports = auth;


