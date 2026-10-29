const AuditLog = require('../models/entities/auditLog');

// Fire-and-forget by design: an audit-log write failing must never block the salary
// action it's recording. Callers don't await error handling here — errors are swallowed
// after a console.error so a DB hiccup on the audit collection can't fail a payroll action.
exports.logAudit = async ({ corporateUserID, actorId, actorRole, action, entity, entityId, employeeId, metadata }) => {
  try {
    await AuditLog.create({
      corporateUser: corporateUserID,
      actorId,
      actorRole: actorRole || null,
      action,
      entity,
      entityId: entityId || null,
      employee: employeeId || null,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
};
