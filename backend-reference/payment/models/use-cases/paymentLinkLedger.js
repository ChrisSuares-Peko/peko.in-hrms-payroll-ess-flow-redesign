const transactionLedger = require("../entities/transactionLedger");

/**
 * Create a new ledger entry in the transaction ledger.
 *
 * @param {Object} params
 * @param {string} params.transactionId - Unique transaction identifier.
 * @param {'CREDIT'|'DEBIT'} params.type - Type of transaction.
 * @param {number|string} params.amount - Transaction amount.
 * @param {'PAYMENT_LINK'|'PAYOUT'|'PAYMENT_QR'|'ENACH_EXEC'|'SETTLEMENT_PAYMENT_LINK'|'SETTLEMENT_PAYMENT_QR'|'SETTLEMENT_ENACH_EXEC'} params.source - Source of the transaction.
 * @param {'PENDING'|'SUCCESS'|'FAILED'} [params.status] - Status of the transaction (optional, default: "PENDING").
 * @param {string} [params.referenceId] - Reference to external system or transaction (optional).
 * @param {number} [params.payoutTransactionId] - ID of related payout transaction (optional).
 * @param {number} [params.paymentLinkId] - ID of related payment link (optional).
 * @param {number|string} [params.balanceAfter] - Balance after transaction (optional).
 * @param {Object} [params.metadata] - Any metadata (object/JSON, optional).
 * @param {string} [params.remarks] - Any remarks (optional).
 * @param {number} params.credentialId - Credential/owner ID of this ledger entry.
 * @returns {Promise<Object>} The created transaction ledger entry.
 */
/**
 * @typedef {Object} CreateLedgerEntryParams
 * @property {string} transactionId - Unique transaction identifier.
 * @property {"CREDIT"|"DEBIT"} type - Type of transaction.
 * @property {number|string} amount - Transaction amount.
 * @property {"PAYMENT_LINK"|"PAYOUT"|"PAYMENT_QR"|"ENACH_EXEC"|"SETTLEMENT_PAYMENT_LINK"|"SETTLEMENT_PAYMENT_QR"|"SETTLEMENT_ENACH_EXEC"} source - Source of the transaction.
 * @property {"PENDING"|"SUCCESS"|"FAILED"} [status] - Status of the transaction (optional, default: "PENDING").
 * @property {string} [referenceId] - Reference to external system or transaction (optional).
 * @property {number} [payoutTransactionId] - ID of related payout transaction (optional).
 * @property {number} [paymentLinkId] - ID of related payment link (optional).
 * @property {number|string} [balanceAfter] - Balance after transaction (optional).
 * @property {Object} [metadata] - Any metadata (object/JSON, optional).
 * @property {string} [remarks] - Any remarks (optional).
 * @property {number} credentialId - Credential/owner ID of this ledger entry.
 */

/**
 * Create a new ledger entry in the transaction ledger.
 *
 * @param {CreateLedgerEntryParams} params
 * @returns {Promise<Object>} The created transaction ledger entry.
 */
async function createLedgerEntry({
    transactionId,
    type,
    amount,
    source,
    credentialId,
    status = "PENDING",
    referenceId = null,
    payoutTransactionId = null,
    paymentLinkId = null,
    balanceAfter = 0.0,
    metadata = null,
    remarks = null
  }) {
  // Basic required fields


  // Create the ledger entry
  return await transactionLedger.create({
    transactionId,
    type,
    amount,
    source,
    credentialId,
    status,
    referenceId,
    payoutTransactionId,
    paymentLinkId,
    balanceAfter,
    metadata,
    remarks
  });
}

async function updateLedgerEntryStatus({ transactionId, status, metadata = null }) {
  if (!transactionId) return 0;
  const fields = { status };
  if (metadata !== null) fields.metadata = metadata;
  const [affectedRows] = await transactionLedger.update(fields, {
    where: { transactionId },
  });
  return affectedRows;
}

module.exports = {
  createLedgerEntry,
  updateLedgerEntryStatus,
};