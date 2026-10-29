"use strict";
const { Op } = require("sequelize");
const transactionLedger = require("../entities/transactionLedger");

/**
 * Create a new ledger entry.
 * @param {object} data - { credentialId, transactionId, type, amount, source, status, referenceId, payoutTransactionId, paymentLinkId, balanceAfter, metadata, remarks }
 */
const createEntry = async (data) => {
  return await transactionLedger.create(data);
};

/**
 * Get available balance for a credential.
 *
 * Available balance = SUM of successful CREDITs minus SUM of non-failed DEBITs.
 * Pending payouts are counted as "used" to prevent double-spending.
 */
const getAvailableBalance = async (credentialId) => {
  const entries = await transactionLedger.findAll({
    where: {
      credentialId,
      [Op.or]: [
        // All successful inward payments
        { type: "CREDIT", status: "SUCCESS" },
        // All non-failed outward payments (PENDING counts as locked)
        { type: "DEBIT", status: { [Op.in]: ["PENDING", "SUCCESS"] } },
      ],
    },
    attributes: ["type", "amount"],
    raw: true,
  });

  let totalCredits = 0;
  let totalDebits = 0;

  for (const entry of entries) {
    const amt = parseFloat(entry.amount);
    if (entry.type === "CREDIT") {
      totalCredits += amt;
    } else {
      totalDebits += amt;
    }
  }

  return parseFloat((totalCredits - totalDebits).toFixed(2));
};

/**
 * Update the status of a ledger entry by its unique transactionId.
 */
const updateEntryStatus = async (transactionId, status) => {
  return await transactionLedger.update(
    { status },
    { where: { transactionId } }
  );
};

/**
 * Find a ledger entry by its unique transactionId.
 */
const findByTransactionId = async (transactionId) => {
  return await transactionLedger.findOne({ where: { transactionId }, raw: true });
};

module.exports = {
  createEntry,
  getAvailableBalance,
  updateEntryStatus,
  findByTransactionId,
};
