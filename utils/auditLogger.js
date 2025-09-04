const AuditLog = require("../models/auditlogModel");

exports.logAction = async ({ module, action, entityId, performedBy, details }) => {
  try {
    await AuditLog.create({ module, action, recordId: entityId, user: performedBy, details });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};
