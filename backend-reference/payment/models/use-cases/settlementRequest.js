const settlementRequest = require("../entities/settlementRequest");

async function createSettlementRequest({
  credentialId,
  amount,
  transferType = "IMPS",
  referenceId,
  decentroTxnId = null,
  status = "PENDING",
  beneficiaryName = null,
  beneficiaryAccountNumber = null,
  beneficiaryIfsc = null,
  settledAt = null,
  metadata = null,
}) {
  return await settlementRequest.create({
    credentialId,
    amount,
    transferType,
    referenceId,
    decentroTxnId,
    status,
    beneficiaryName,
    beneficiaryAccountNumber,
    beneficiaryIfsc,
    settledAt,
    metadata,
  });
}

async function findSettlementRequestsByCredential({ credentialId, page = 0, limit = 10 }) {
  return await settlementRequest.findAndCountAll({
    where: { credentialId },
    order: [["created_at", "DESC"]],
    offset: page * limit,
    limit,
    raw: true,
  });
}

async function findByDecentroTxnId(decentroTxnId) {
  return await settlementRequest.findOne({ where: { decentroTxnId } });
}

async function updateSettlementStatus(id, { status, settledAt, metadata }) {
  const updates = { status };
  if (settledAt !== undefined) updates.settledAt = settledAt;
  if (metadata !== undefined) updates.metadata = metadata;
  await settlementRequest.update(updates, { where: { id } });
}

module.exports = {
  createSettlementRequest,
  findSettlementRequestsByCredential,
  findByDecentroTxnId,
  updateSettlementStatus,
};
