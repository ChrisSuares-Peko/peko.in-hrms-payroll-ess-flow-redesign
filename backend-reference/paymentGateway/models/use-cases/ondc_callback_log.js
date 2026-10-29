const ondcCallbackLogs = require("../entities/ondc_callback_log");

/**
 * Latest successful on_init callback for a transaction_id.
 * Provides the raw message.order + context needed for BPP /confirm.
 */
const findLatestOnInitByTransactionId = async (transactionId) => {
  if (!transactionId) return null;
  return ondcCallbackLogs.findOne({
    where: {
      action: "on_init",
      transactionId: String(transactionId),
      hasError: false,
    },
    order: [["id", "DESC"]],
    raw: true,
  });
};

module.exports = {
  findLatestOnInitByTransactionId,
};
