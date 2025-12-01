const AuditLog = require('../models/AuditLog');

async function logAudit({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  metadata = null,
}) {
  try {
    if (!action) return;
    await AuditLog.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (err) {
    // Avoid breaking the main flow if logging fails
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log', err);
  }
}

module.exports = {
  logAudit,
};


