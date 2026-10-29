const asyncHandler = require("../../middlewares/async");
const axios = require("axios");
const { findByReferenceId, updateStatus } = require("../../models/use-cases/payoutTransaction");
const { updateEntryStatus } = require("../../models/use-cases/transactionLedger");
const { customLog } = require("../../utils/loggerHelper");

const PAYROLL_INTERNAL_WEBHOOK_PATH = "/api/v1/corporate/decentro/payroll/webhook/payout/update";
const payrollWebhookUrl = () =>
  process.env.PAYROLL_PAYOUT_WEBHOOK_URL ||
  `${(process.env.PAYROLL_SERVICE_URL || process.env.PAYROLL_MS_URL || "http://localhost:4450").replace(/\/+$/, "")}${PAYROLL_INTERNAL_WEBHOOK_PATH}`;

const forwardHeaders = (headers = {}) => {
  const safeHeaders = { ...headers };
  ["host", "connection", "content-length", "transfer-encoding"].forEach((key) => delete safeHeaders[key]);
  return {
    ...safeHeaders,
    "x-peko-forwarded-from": "payment-ms",
    "x-peko-original-headers": Buffer.from(JSON.stringify(headers)).toString("base64"),
  };
};

const forwardToPayrollWebhook = async (req, referenceId) => {
  const webhookUrl = payrollWebhookUrl();
  customLog(req?.LogTraceId, "info", {
    message: "Payout transaction not found in payment MS, forwarding to payroll webhook",
    data: { referenceId, webhookUrl },
  });

  const response = await axios({
    method: "POST",
    url: webhookUrl,
    data: req.body,
    headers: forwardHeaders(req.headers),
    timeout: 15000,
    validateStatus: () => true,
  });

  return response;
};

/**
 * POST /webhook/decentro/payment/payout/update
 * Decentro calls this with the final payout transaction status
 */
exports.payoutWebhookHandler = asyncHandler(async (req, res) => {
  const body = req.body;
  customLog(req?.LogTraceId, "info", { message: "Payout webhook received", data: body });

  const referenceId = body?.referenceId || body?.reference_id || body?.data?.referenceId || body?.data?.reference_id;
  if (!referenceId) {
    return res.status(400).json({ status: false, message: "referenceId is missing", responseCode: "400" });
  }

  const transaction = await findByReferenceId(referenceId);
  if (!transaction) {
    const payrollResponse = await forwardToPayrollWebhook(req, referenceId);
    return res.status(payrollResponse.status).json(payrollResponse.data);
  }

  if (transaction.status === "COMPLETED" || transaction.status === "FAILED") {
    return res.status(200).json({ status: true, message: "Transaction already finalized", responseCode: "000" });
  }

  const txnStatus = body?.transactionStatus;
  const decentroTxnId = body?.decentroTxnId;

  const finalStatus =
    txnStatus === "success" ? "COMPLETED" : txnStatus === "failure" ? "FAILED" : "PENDING";

  await updateStatus(transaction.id, finalStatus, decentroTxnId);

  // Sync ledger entry: PENDING → SUCCESS or FAILED
  const ledgerStatus = finalStatus === "COMPLETED" ? "SUCCESS" : finalStatus === "FAILED" ? "FAILED" : "PENDING";
  await updateEntryStatus(referenceId, ledgerStatus);

  customLog(req?.LogTraceId, "info", { message: `Payout transaction ${referenceId} updated to ${finalStatus}` });

  return res.status(200).json({ status: true, message: "Transaction status updated successfully", responseCode: "000" });
});
