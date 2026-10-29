const asyncHandler = require("../../middlewares/async");
const { findByDecentroTxnId, updateSettlementStatus } = require("../../models/use-cases/settlementRequest");
const { updateEntryStatus } = require("../../models/use-cases/transactionLedger");
const { customLog } = require("../../utils/loggerHelper");

const DECENTRO_CALLBACK_ACK = "CB_S00000";

/**
 * POST /webhook/decentro/payment/settlement/callback
 * Decentro calls this with the final settlement status (SUCCESS or FAILURE).
 * Fired up to 3 times per transaction — handler is idempotent.
 */
exports.settlementWebhookHandler = asyncHandler(async (req, res) => {
  const {
    decentro_txn_id,
    settlement_status,
    settlement_status_message,
    bank_reference_number,
    settlement_urn,
    transfer_type,
    updated_balance,
    callback_txn_id,
    callback_attempt,
    callback_timestamp,
    virtual_account_number,
    settlement_account_number,
    settlement_account_ifsc,
  } = req.body;

  customLog(req?.LogTraceId, "info", {
    message: "Settlement webhook received",
    decentro_txn_id,
    settlement_status,
    callback_txn_id,
    callback_attempt,
  });

  if (!decentro_txn_id || !settlement_status) {
    return res.status(400).json({
      status: false,
      message: "Missing required fields: decentro_txn_id, settlement_status",
      responseCode: "400",
    });
  }

  const record = await findByDecentroTxnId(decentro_txn_id);
  if (!record) {
    customLog(req?.LogTraceId, "error", {
      message: "Settlement webhook: record not found",
      decentro_txn_id,
    });
    return res.status(404).json({
      status: false,
      message: "Settlement record not found",
      responseCode: "404",
    });
  }

  // Idempotent — already finalized, ack without re-processing
  if (record.status === "SUCCESS" || record.status === "FAILED") {
    return res.status(200).json({ response_code: DECENTRO_CALLBACK_ACK });
  }

  const normalizedStatus = settlement_status === "SUCCESS" ? "SUCCESS" : "FAILED";
  const settledAt = normalizedStatus === "SUCCESS" ? new Date() : undefined;

  await updateSettlementStatus(record.id, {
    status: normalizedStatus,
    settledAt,
    metadata: {
      ...(record.metadata || {}),
      webhookPayload: {
        decentro_txn_id,
        settlement_status,
        settlement_status_message,
        bank_reference_number,
        settlement_urn,
        transfer_type,
        updated_balance,
        callback_txn_id,
        callback_attempt,
        callback_timestamp,
        virtual_account_number,
        settlement_account_number,
        settlement_account_ifsc,
      },
    },
  });

  try {
    await updateEntryStatus(record.referenceId, normalizedStatus);
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "Settlement webhook: ledger sync failed",
      referenceId: record.referenceId,
      decentro_txn_id,
      error: err?.message,
    });
  }

  customLog(req?.LogTraceId, "info", {
    message: "Settlement webhook processed",
    referenceId: record.referenceId,
    status: normalizedStatus,
  });

  return res.status(200).json({ response_code: DECENTRO_CALLBACK_ACK });
});
