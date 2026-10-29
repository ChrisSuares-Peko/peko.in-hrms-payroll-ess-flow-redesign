const SettlementRecord = require("../entities/settlementRecords");

async function createSettlementRecord(recordData) {
  if (!recordData || typeof recordData !== "object") {
    throw new Error("recordData object is required");
  }
  if (!recordData.paymentLinkId) {
    throw new Error("paymentLinkId is required");
  }
  if (!recordData.amount) {
    throw new Error("amount is required");
  }
  if (!recordData.transferType) {
    throw new Error("transferType is required");
  }
  if (!recordData.referenceId) {
    throw new Error("referenceId is required");
  }

  // Create the new settlement record
  return await SettlementRecord.create({
    paymentLinkId: recordData.paymentLinkId,
    credentialId: recordData.credentialId,
    amount: recordData.amount,
    transferType: recordData.transferType,
    referenceId: recordData.referenceId,
    decentroTxnId: recordData.decentroTxnId,
    txnStatus: recordData.txnStatus,
    beneficiaryName: recordData.beneficiaryName,
    beneficiaryAccountNumber: recordData.beneficiaryAccountNumber,
    beneficiaryIfsc: recordData.beneficiaryIfsc,
    settledAt: recordData.settledAt,
    meta: recordData.meta,
  });
}

module.exports = {
  createSettlementRecord,
};