const asyncHandler = require("../../../middlewares/async");
const {
  createPaymentLink,
  createDynamicQr,
  issueUpiCollectRequest,
  // createVirtualAccount,
  getTransactionStatus,
  registerEnachMandate,
  getEnachMandateRegistrationStatus,
  manageEnachMandate: manageEnachMandateAction,
  executeEnachMandate,
  getEnachMandateExecutionStatus,
  createVirtualAccountV3,
  getVirtualAccountBalance,
  getVirtualAccountBalanceV2,
  getVirtualAccountStatementV2,
  addSettlementAccount,
  addSplitSettlementRule,
  initiateTransfer,
} = require("../../../services/paymentLinks");
const { deactivateVirtualAccount, loadUnloadVirtualAccount, updateVirtualAccount } = require("../../../utils/decentroGateway");
const {
  storePaymentLink,
  getPaymentLinksCount,
  getActivePaymentLinksCount,
  updatePaymentLinkStatus,
  getTotalAmountFromPaymentLink,
  findAllPaymentLinks,
  findAllPaymentLinksForExport,
  findPaymentLinkById,
  findInvoicePaymentLinkByInvoiceId,
  findPaymentLinkByIdentifiers,
  createPendingUnifiedTransaction,
  upsertUnifiedTransactionStatus,
} = require("../../../models/use-cases/paymentLink");
const {
  addPaymentQr,
  findAllPaymentQrs,
  findAllPaymentQrsForExport,
  findPaymentQrById,
  findPaymentQrByIdentifiers,
  getPaymentQrsCount,
  getActivePaymentQrsCount,
  getTotalAmountFromPaymentQr,
  updatePaymentQrStatus,
} = require("../../../models/use-cases/paymentQr");

const {
  findOnboardingByCredential,
  saveStep1,
  savePanStep,
  saveBankStep,
  saveStep2AndActivate,
  suspendOnboarding,
  updateOnboardingProfile,
} = require("../../../models/use-cases/paymentLinkOnboarding");
const ErrorResponse = require("../../../utils/error-response");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { generateExcelBufferAndType } = require("../../../utils/generateExcelBufferAndType");
const { payoutReceiptTemplate } = require("../../../utils/reportTemplate");
const { addUpiCollectRequest } = require("../../../models/use-cases/upiCollectRequest");
const {
  addEnachMandate,
  findAllEnachMandates,
  findEnachMandateByReferenceId,
  updateEnachMandateByReferenceId,
} = require("../../../models/use-cases/eNachMandate");
const {
  addEnachMandateExecution,
  findAllEnachMandateExecutions,
  findEnachMandateExecutionByDecentroTxnId,
  findEnachMandateExecutionByReferenceId,
  findLatestEnachMandateExecutionByStatuses,
  updateEnachMandateExecutionStatus,
} = require("../../../models/use-cases/eNachMandateExecution");
const { createLedgerEntry, updateLedgerEntryStatus } = require("../../../models/use-cases/paymentLinkLedger");
const { createSettlementRequest, findSettlementRequestsByCredential } = require("../../../models/use-cases/settlementRequest");
const { findInvoiceById } = require("../../../models/use-cases/invoicingV2");
const { findInvoiceSettingsByCorporateUserId } = require("../../../models/use-cases/invoiceSettingsV2");
const { findOneWithCredentialId } = require("../../../models/use-cases/corporateUser");
const invoiceCustomerV2 = require("../../../models/entities/invoiceCustomerV2");
const { ENACH_SUCCESS_STATUSES, ENACH_FAILED_STATUSES, ENACH_FREQUENCY_VALUES, ENACH_CATEGORY_CODE_VALUES, IST_TIMEZONE, ENACH_EXECUTION_COUNTED_STATUSES, ENACH_SAME_DAY_CUTOFF_HOUR_IST, ENACH_EXECUTION_TERMINAL_STATUSES, ENACH_EXECUTION_PENDING_STATUSES, BANK_DETAILS_FALLBACKS, BANK_TRANSFER_METHODS } = require("../../../utils/paymentLinks");
const { customLog } = require("../../../utils/loggerHelper");
const { verifyPan, verifyBankAccount } = require("../../../utils/cashfreeGateway");
const { findOneWithCredentialId: findCorporateUserByCredentialId } = require("../../../models/use-cases/corporateUser");
const invoicingV2 = require("../../../models/entities/invoicingV2");
const { v4 } = require("uuid");

const logUnifiedSyncError = async (req, context, error, meta = {}) => {
  await customLog(req?.LogTraceId, "error", {
    error: error?.message || "Unknown unified transaction sync error",
    context,
    ...meta,
  });
};

const logLedgerSyncError = async (req, context, error, meta = {}) => {
  await customLog(req?.LogTraceId, "error", {
    error: error?.message || "Unknown ledger sync error",
    context,
    ...meta,
  });
};

const syncLedgerEntry = async (req, context, payload, meta = {}) => {
  try {
    await createLedgerEntry(payload);
  } catch (ledgerSyncError) {
    await logLedgerSyncError(req, context, ledgerSyncError, meta);
  }
};

const syncLedgerEntryStatus = async (req, context, payload, meta = {}) => {
  try {
    await updateLedgerEntryStatus(payload);
  } catch (ledgerSyncError) {
    await logLedgerSyncError(req, context, ledgerSyncError, meta);
  }
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getBankDetailsPdfTemplate = ({ bankDetails, transferMethods }) => {
  const detailsRows = bankDetails
    .map(
      (detail) => `
        <tr>
          <td class="label">${escapeHtml(detail.label)}</td>
          <td class="value">${escapeHtml(detail.value)}</td>
        </tr>`
    )
    .join("");

  const methodsRows = transferMethods
    .map(
      (method) => `
        <li>
          <span class="method-name">${escapeHtml(method.name)}</span>
          <span class="method-desc"> - ${escapeHtml(method.description)}</span>
        </li>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Bank Transfer Details</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 32px;
            color: #1f2937;
            background: #ffffff;
          }
          .container {
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 24px;
          }
          h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
            line-height: 1.2;
          }
          .subtitle {
            margin: 0 0 24px 0;
            color: #6b7280;
            font-size: 14px;
          }
          .section-title {
            font-size: 18px;
            margin: 0 0 6px 0;
          }
          .section-subtitle {
            margin: 0 0 16px 0;
            color: #6b7280;
            font-size: 13px;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 24px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
            vertical-align: top;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .label {
            width: 30%;
            color: #6b7280;
            background: #f9fafb;
            font-weight: 600;
          }
          .value {
            color: #111827;
            font-weight: 500;
            word-break: break-word;
          }
          .methods {
            margin: 8px 0 0 0;
            padding-left: 18px;
          }
          .methods li {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
          }
          .methods li:last-child {
            margin-bottom: 0;
          }
          .method-name {
            font-weight: 700;
            color: #111827;
          }
          .method-desc {
            color: #4b5563;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Bank Transfer Details</h1>
          <p class="subtitle">Share these details with your customer for NEFT, RTGS, or IMPS transfers</p>

          <h2 class="section-title">Virtual Account</h2>
          <p class="section-subtitle">Use for direct bank transfers</p>

          <div class="card">
            <table>
              <tbody>
                ${detailsRows}
              </tbody>
            </table>
          </div>

          <h2 class="section-title">Supported Transfer Methods</h2>
          <ul class="methods">
            ${methodsRows}
          </ul>
        </div>
      </body>
    </html>
  `;
};

const getEnachStatusType = (status) => {
  if (ENACH_SUCCESS_STATUSES.has(status)) return "success";
  if (ENACH_FAILED_STATUSES.has(status)) return "failed";
  return "pending";
};

const normalizeFrequency = (value) => {
  const raw = String(value || "").trim();
  return ENACH_FREQUENCY_VALUES.find(
    (item) => item.toUpperCase() === raw.toUpperCase()
  );
};

const normalizeCategoryCode = (value) => {
  const raw = String(value || "").trim().toUpperCase();
  return ENACH_CATEGORY_CODE_VALUES.find((item) => item === raw);
};

const resolveExecutionStatus = (providerResponse = {}, fallbackStatus = "INITIATED") =>
  String(
    providerResponse?.data?.transaction_status ||
      providerResponse?.data?.presentation_status ||
      providerResponse?.data?.status ||
      providerResponse?.presentation_status ||
      providerResponse?.status ||
      providerResponse?.api_status ||
      fallbackStatus
  ).toUpperCase();

const DECENTRO_COLLECTION_CALLBACK_ACK = "CB_S00000";

const parseOccurredAt = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const normalizeCollectionType = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const isWebhookCollectionPayload = (payload = {}) =>
  Boolean(
    payload?.transaction_status ||
      payload?.collection_type ||
      payload?.callback_txn_id ||
      payload?.callback_timestamp
  );

const syncUnifiedCollectionWebhookStatus = async ({
  req,
  source,
  record,
  status,
  occurredAt,
  rawPayload,
}) => {
  if (!record) {
    return;
  }

  try {
    const basePayload = {
      credentialId: record.credentialId,
      source,
      sourceTxnId: record.reference_id,
      providerTxnId: record.decentro_txn_id || null,
      status,
      amount: record.amount,
      createdMilestoneAt: record.createdAt || new Date(),
      occurredAt,
      rawPayload:
        rawPayload && typeof rawPayload === "object"
          ? { webhookPayload: rawPayload }
          : null,
      event: {
        key: `status_${String(status).toLowerCase()}`,
        label: `Status updated to ${String(status).toUpperCase()}`,
        status,
        occurredAt,
      },
    };

    if (source === "payment_link") {
      await upsertUnifiedTransactionStatus({
        ...basePayload,
        customerName: record.customerName || null,
        customerPhone: record.customerPhone || null,
        linkUrl: record.paymentLink || null,
        reference: record.reference_id || null,
        purposeMessage: record.purpose_message || null,
      });
      return;
    }

    if (source === "payment_qr") {
      await upsertUnifiedTransactionStatus({
        ...basePayload,
        qrImageUrl: record.dynamic_qr_image || null,
        reference: record.reference_id || null,
        purposeMessage: record.purpose_message || null,
      });
    }
  } catch (unifiedSyncError) {
    await logUnifiedSyncError(req, "verifyPayment.webhookStatusSync", unifiedSyncError, {
      source,
      sourceTxnId: record.reference_id,
      corporateUser: record.credentialId,
    });
  }
};

const handleLegacyPaymentStatusVerification = async (req, res) => {
  const reference_id = req.body.reference_id;

  if (!reference_id) {
    return res.status(400).json({
      status: false,
      message: "Payment link ID is required",
      data: {
        status: "ERROR",
      },
      responseCode: "400",
    });
  }

  const result = await getTransactionStatus(reference_id);
  const providerStatus = String(
    result?.data?.transaction_status || "PENDING"
  ).toUpperCase();
  const linkUpdateResult = await updatePaymentLinkStatus({
    reference_id,
    status: providerStatus,
    rawPayload: result,
    skipUnifiedSync: true,
  });

  const paymentLink = linkUpdateResult?.paymentLink || null;
  const statusOccurredAt =
    paymentLink?.settledDate ||
    paymentLink?.successOrFailDate ||
    paymentLink?.createdAt ||
    new Date();

  if (paymentLink && linkUpdateResult?.statusChanged) {
    await syncUnifiedCollectionWebhookStatus({
      req,
      source: "payment_link",
      record: paymentLink,
      status: providerStatus,
      occurredAt: statusOccurredAt,
      rawPayload: result,
    });

    const ledgerStatus = PAYMENT_SUCCESS_STATUSES.has(providerStatus)
      ? "SUCCESS"
      : PAYMENT_FAILED_STATUSES.has(providerStatus)
      ? "FAILED"
      : null;
    if (ledgerStatus) {
      await syncLedgerEntryStatus(
        req,
        "handleLegacyPaymentStatusVerification.ledgerStatusSync",
        {
          transactionId: paymentLink.decentro_txn_id,
          status: ledgerStatus,
        },
        { referenceId: paymentLink.reference_id, corporateUser: paymentLink.credentialId }
      );
    }
  }

  if (!["SUCCESS", "PENDING"].includes(providerStatus)) {
    return res.status(400).json({
      status: false,
      message: "Payment Failed",
      data: {
        status: providerStatus,
      },
      responseCode: "400",
    });
  }

  return res.status(200).json({
    status: true,
    message: "Payment status fetched successfully",
    responseCode: "000",
    data: {
      status: providerStatus,
    },
  });
};

const getISTDateTimeParts = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }
  return {
    ymd: `${map.year}-${map.month}-${map.day}`,
    hour: Number(map.hour || 0),
    minute: Number(map.minute || 0),
  };
};

const normalizeToISTYmd = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return getISTDateTimeParts(parsedDate).ymd;
};

const addDaysToYmd = (ymd, days) => {
  const [year, month, day] = String(ymd)
    .split("-")
    .map((part) => Number(part));
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + Number(days || 0));
  const nextYear = utcDate.getUTCFullYear();
  const nextMonth = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const formatDateTimeInIST = (dateValue) => {
  if (!dateValue) return null;

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsedDate);
};

const addDaysToDateUTC = (dateValue, daysToAdd) => {
  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) return null;

  const resultDate = new Date(baseDate.getTime());
  resultDate.setUTCDate(resultDate.getUTCDate() + Number(daysToAdd || 0));
  return resultDate;
};

const addMonthsToDateUTCClamped = (dateValue, monthsToAdd) => {
  const baseDate = new Date(dateValue);
  if (Number.isNaN(baseDate.getTime())) return null;

  const baseYear = baseDate.getUTCFullYear();
  const baseMonth = baseDate.getUTCMonth();
  const baseDay = baseDate.getUTCDate();

  let targetMonthIndex = baseMonth + Number(monthsToAdd || 0);
  let targetYear = baseYear + Math.floor(targetMonthIndex / 12);
  targetMonthIndex %= 12;
  if (targetMonthIndex < 0) {
    targetMonthIndex += 12;
    targetYear -= 1;
  }

  const maxDayInTargetMonth = new Date(
    Date.UTC(targetYear, targetMonthIndex + 1, 0)
  ).getUTCDate();
  const targetDay = Math.min(baseDay, maxDayInTargetMonth);

  return new Date(
    Date.UTC(
      targetYear,
      targetMonthIndex,
      targetDay,
      baseDate.getUTCHours(),
      baseDate.getUTCMinutes(),
      baseDate.getUTCSeconds(),
      baseDate.getUTCMilliseconds()
    )
  );
};

const getNextAllowedExecutionAtByFrequency = (frequency, lastExecutionAt) => {
  const normalizedFrequency = normalizeFrequency(frequency);
  if (!normalizedFrequency || !lastExecutionAt) return null;

  switch (normalizedFrequency) {
    case "Adhoc":
      return null;
    case "Daily":
      return addDaysToDateUTC(lastExecutionAt, 1);
    case "Weekly":
      return addDaysToDateUTC(lastExecutionAt, 7);
    case "Bi-Monthly":
      return addMonthsToDateUTCClamped(lastExecutionAt, 2);
    case "Monthly":
      return addMonthsToDateUTCClamped(lastExecutionAt, 1);
    case "Quarterly":
      return addMonthsToDateUTCClamped(lastExecutionAt, 3);
    case "Semi-Annually":
      return addMonthsToDateUTCClamped(lastExecutionAt, 6);
    case "Yearly":
      return addMonthsToDateUTCClamped(lastExecutionAt, 12);
    default:
      return null;
  }
};

const buildEnachInitiationGuard = async ({
  reference_id,
  corporateUser,
  frequency,
}) => {
  const normalizedFrequency = normalizeFrequency(frequency) || "Adhoc";

  if (normalizedFrequency === "Adhoc") {
    return {
      can_initiate: true,
      frequency: normalizedFrequency,
      last_counted_execution_at: null,
      next_allowed_at: null,
      message: "Eligible to initiate now.",
    };
  }

  const latestCountedExecution = await findLatestEnachMandateExecutionByStatuses({
    mandate_reference_id: reference_id,
    corporateUser,
    statuses: [...ENACH_EXECUTION_COUNTED_STATUSES],
  });

  if (!latestCountedExecution?.createdAt) {
    return {
      can_initiate: true,
      frequency: normalizedFrequency,
      last_counted_execution_at: null,
      next_allowed_at: null,
      message: "Eligible to initiate now.",
    };
  }

  const nextAllowedAt = getNextAllowedExecutionAtByFrequency(
    normalizedFrequency,
    latestCountedExecution.createdAt
  );

  if (!nextAllowedAt) {
    return {
      can_initiate: true,
      frequency: normalizedFrequency,
      last_counted_execution_at: latestCountedExecution.createdAt,
      next_allowed_at: null,
      message: "Eligible to initiate now.",
    };
  }

  const now = new Date();
  const canInitiate = now.getTime() >= nextAllowedAt.getTime();
  const lastExecutionAtLabel = formatDateTimeInIST(latestCountedExecution.createdAt);
  const nextAllowedAtLabel = formatDateTimeInIST(nextAllowedAt);

  return {
    can_initiate: canInitiate,
    frequency: normalizedFrequency,
    last_counted_execution_at: latestCountedExecution.createdAt,
    next_allowed_at: nextAllowedAt.toISOString(),
    message: canInitiate
      ? "Eligible to initiate now."
      : `Initiation is allowed once per ${normalizedFrequency} window. Last counted initiation: ${lastExecutionAtLabel} IST. Next allowed at: ${nextAllowedAtLabel} IST.`,
  };
};

const buildUnifiedTransactions = ({ paymentLinkRows = [], paymentQrRows = [] }) => {
  const linkTransactions = paymentLinkRows.map((record) => ({
    source: "payment_link",
    key: `plink_${record.id}`,
    id: record.id,
    createdAt: record.createdAt,
    transactionId:
      record.transactionId || record.decentro_txn_id || record.reference_id || "N/A",
    amount: Number(record.amount || 0),
    status: String(record.status || "PENDING").toUpperCase(),
    reference: record.purpose_message || "N/A",
    purpose_message: record.purpose_message || "N/A",
    reference_id: record.reference_id || null,
    decentro_txn_id: record.decentro_txn_id || null,
    customerName: record.customerName || null,
    customerPhone: record.customerPhone || null,
    paymentLink: record.paymentLink || null,
    paymentMethod:"Payment Link",
    dynamic_qr_image: null,
  }));

  const qrTransactions = paymentQrRows.map((record) => ({
    source: "payment_qr",
    key: `pqr_${record.id}`,
    id: record.id,
    createdAt: record.createdAt,
    transactionId:record.transactionId || record.decentro_txn_id || record.reference_id || `QR-${record.id}`,
    amount: Number(record.amount || 0),
    status: String(record.status || "PENDING").toUpperCase(),
    reference: record.purpose_message || "N/A",
    purpose_message: record.purpose_message || "N/A",
    reference_id: record.reference_id || null,
    decentro_txn_id: record.decentro_txn_id || null,
    customerName: null,
    customerPhone: null,
    paymentLink: record.dynamic_qr_image || null,
    paymentMethod:"QR Code",
    dynamic_qr_image: record.dynamic_qr_image || null,
  }));

  return [...linkTransactions, ...qrTransactions].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
};

const PAYMENT_SUCCESS_STATUSES = new Set([
  "SUCCESS",
  "COMPLETED",
  "PAID",
  "SETTLED",
  "SETTLEMENT_SUCCESS",
  "SETTLEMENT_COMPLETED",
  "SETTLEMENT_DONE",
]);
const PAYMENT_FAILED_STATUSES = new Set([
  "FAILED",
  "FAILURE",
  "ERROR",
  "DECLINED",
  "CANCELLED",
  "EXPIRED",
]);
const PAYMENT_SETTLED_STATUSES = new Set([
  "SETTLED",
  "SETTLEMENT_SUCCESS",
  "SETTLEMENT_COMPLETED",
  "SETTLEMENT_DONE",
]);

const normalizePaymentStatus = (status) => String(status || "PENDING").toUpperCase();

const buildTransactionTimeline = ({
  createdAt,
  status,
  successOrFailDate,
  settledDate,
}) => {
  const normalizedStatus = normalizePaymentStatus(status);
  const isFailed = PAYMENT_FAILED_STATUSES.has(normalizedStatus);
  const isSuccessful = PAYMENT_SUCCESS_STATUSES.has(normalizedStatus);
  const isSettled = PAYMENT_SETTLED_STATUSES.has(normalizedStatus) || !!settledDate;

  const paymentStepLabel = isFailed
    ? "Payment Failed"
    : isSuccessful
      ? "Payment Successful"
      : "Payment Pending";
  const paymentStepColor = isFailed
    ? "#DC2626"
    : isSuccessful
      ? "#16A34A"
      : "#D97706";
  const paymentStepTime = successOrFailDate || createdAt || "N/A";

  const settlementStepLabel = isSettled
    ? "Settlement Completed"
    : isFailed
      ? "Settlement Not Applicable"
      : "Settlement Pending";
  const settlementStepColor = isSettled
    ? "#16A34A"
    : isFailed
      ? "#6B7280"
      : "#D97706";
  const settlementStepTime = settledDate
    ? settledDate
    : isFailed
      ? "Not applicable"
      : "Awaiting settlement";

  return [
    {
      label: "Created",
      time: createdAt || "N/A",
      color: "#2563EB",
    },
    {
      label: paymentStepLabel,
      time: paymentStepTime,
      color: paymentStepColor,
    },
    {
      label: settlementStepLabel,
      time: settlementStepTime,
      color: settlementStepColor,
    },
  ];
};

const parseTransactionKey = (id) => {
  const rawId = String(id || "").trim();
  if (!rawId) return { source: null, id: null };

  if (rawId.startsWith("plink_")) {
    return { source: "payment_link", id: rawId.replace("plink_", "") };
  }

  if (rawId.startsWith("pqr_")) {
    return { source: "payment_qr", id: rawId.replace("pqr_", "") };
  }

  return { source: "payment_link", id: rawId };
};

module.exports = {
  asyncHandler,
  createPaymentLink,
  createDynamicQr,
  issueUpiCollectRequest,
  getTransactionStatus,
  registerEnachMandate,
  getEnachMandateRegistrationStatus,
  manageEnachMandateAction,
  executeEnachMandate,
  getEnachMandateExecutionStatus,
  createVirtualAccountV3,
  getVirtualAccountBalance,
  getVirtualAccountBalanceV2,
  getVirtualAccountStatementV2,
  addSettlementAccount,
  addSplitSettlementRule,
  storePaymentLink,
  getPaymentLinksCount,
  getActivePaymentLinksCount,
  updatePaymentLinkStatus,
  getTotalAmountFromPaymentLink,
  findAllPaymentLinks,
  findAllPaymentLinksForExport,
  findPaymentLinkById,
  findInvoicePaymentLinkByInvoiceId,
  findPaymentLinkByIdentifiers,
  createPendingUnifiedTransaction,
  upsertUnifiedTransactionStatus,
  addPaymentQr,
  findAllPaymentQrs,
  findAllPaymentQrsForExport,
  findPaymentQrById,
  findPaymentQrByIdentifiers,
  getPaymentQrsCount,
  getActivePaymentQrsCount,
  getTotalAmountFromPaymentQr,
  updatePaymentQrStatus,
  findOnboardingByCredential,
  saveStep1,
  savePanStep,
  saveBankStep,
  saveStep2AndActivate,
  suspendOnboarding,
  deactivateVirtualAccount,
  loadUnloadVirtualAccount,
  updateVirtualAccount,
  updateOnboardingProfile,
  ErrorResponse,
  fs,
  puppeteer,
  generateExcelBufferAndType,
  payoutReceiptTemplate,
  addUpiCollectRequest,
  addEnachMandate,
  findAllEnachMandates,
  findEnachMandateByReferenceId,
  updateEnachMandateByReferenceId,
  addEnachMandateExecution,
  findAllEnachMandateExecutions,
  findEnachMandateExecutionByDecentroTxnId,
  findEnachMandateExecutionByReferenceId,
  findLatestEnachMandateExecutionByStatuses,
  updateEnachMandateExecutionStatus,
  createLedgerEntry,
  updateLedgerEntryStatus,
  createSettlementRequest,
  findSettlementRequestsByCredential,
  initiateTransfer,
  findInvoiceById,
  findInvoiceSettingsByCorporateUserId,
  findOneWithCredentialId,
  invoiceCustomerV2,
  ENACH_SUCCESS_STATUSES,
  ENACH_FAILED_STATUSES,
  ENACH_FREQUENCY_VALUES,
  ENACH_CATEGORY_CODE_VALUES,
  IST_TIMEZONE,
  ENACH_EXECUTION_COUNTED_STATUSES,
  ENACH_SAME_DAY_CUTOFF_HOUR_IST,
  ENACH_EXECUTION_TERMINAL_STATUSES,
  ENACH_EXECUTION_PENDING_STATUSES,
  BANK_DETAILS_FALLBACKS,
  BANK_TRANSFER_METHODS,
  customLog,
  verifyPan,
  verifyBankAccount,
  findCorporateUserByCredentialId,
  invoicingV2,
  v4,
  logUnifiedSyncError,
  logLedgerSyncError,
  syncLedgerEntry,
  syncLedgerEntryStatus,
  escapeHtml,
  getBankDetailsPdfTemplate,
  getEnachStatusType,
  normalizeFrequency,
  normalizeCategoryCode,
  resolveExecutionStatus,
  DECENTRO_COLLECTION_CALLBACK_ACK,
  parseOccurredAt,
  normalizeCollectionType,
  isWebhookCollectionPayload,
  syncUnifiedCollectionWebhookStatus,
  handleLegacyPaymentStatusVerification,
  getISTDateTimeParts,
  normalizeToISTYmd,
  addDaysToYmd,
  formatDateTimeInIST,
  addDaysToDateUTC,
  addMonthsToDateUTCClamped,
  getNextAllowedExecutionAtByFrequency,
  buildEnachInitiationGuard,
  buildUnifiedTransactions,
  PAYMENT_SUCCESS_STATUSES,
  PAYMENT_FAILED_STATUSES,
  PAYMENT_SETTLED_STATUSES,
  normalizePaymentStatus,
  buildTransactionTimeline,
  parseTransactionKey,
};
