const mongoose = require('mongoose');

// Sensitive salary/CTC data is personal data under India's DPDP Act — this is the audit
// trail of who touched what, additive-only (new collection, no changes to any existing
// entity) so it can't break anything already working.
const auditLogSchema = new mongoose.Schema(
  {
    corporateUser: { type: String, ref: 'CorporateUser', required: true },
    actorId: { type: String, required: true },
    actorRole: { type: String, default: null },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

auditLogSchema.index({ corporateUser: 1, employee: 1, createdAt: -1 });

auditLogSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
