"use strict";

const paymentCollectionTransaction = require("../entities/paymentCollectionTransaction");

const VALID_SOURCES = new Set(["payment_link", "payment_qr", "enach_initiation"]);
const OUTCOME_STATUSES = new Set(["SUCCESS", "FAILED", "CANCELLED"]);

const toIsoString = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const toDate = (value, fallback = new Date()) => {
  const iso = toIsoString(value);
  if (!iso) return fallback;
  return new Date(iso);
};

const ensureSource = (source) => {
  if (!VALID_SOURCES.has(source)) {
    throw new Error(`Invalid source. Allowed values: ${Array.from(VALID_SOURCES).join(", ")}`);
  }
};

const normalizeUnifiedStatus = (rawStatus) => {
  const status = String(rawStatus || "").trim().toUpperCase();

  if (!status) return "PENDING";

  if (["SETTLED", "SETTLEMENT_SUCCESS", "SETTLEMENT_COMPLETED", "SETTLEMENT_DONE"].includes(status)) {
    return "SETTLED";
  }

  if (["SUCCESS", "COMPLETED", "PAID", "DONE", "APPROVED", "ACTIVE", "REGISTERED"].includes(status)) {
    return "SUCCESS";
  }

  if (["FAILED", "FAILURE", "ERROR", "DECLINED", "REJECTED", "EXPIRED"].includes(status)) {
    return "FAILED";
  }

  if (["CANCELLED", "CANCELED", "VOID", "VOIDED"].includes(status)) {
    return "CANCELLED";
  }

  if (["PENDING", "PROCESSING", "IN_PROGRESS", "INITIATED"].includes(status)) {
    return "PENDING";
  }

  return "PENDING";
};

const appendTimelineEvent = (existingEvents, event) => {
  const events = Array.isArray(existingEvents) ? [...existingEvents] : [];
  if (!event || typeof event !== "object") {
    return events;
  }

  const key = String(event.key || event.status || "event").trim();
  if (!key) {
    return events;
  }

  const occurredAt = toIsoString(event.occurredAt) || new Date().toISOString();
  const isDuplicate = events.some((item) => {
    const itemKey = String(item?.key || "").trim();
    const itemOccurredAt = toIsoString(item?.occurredAt);
    return itemKey === key && itemOccurredAt === occurredAt;
  });

  if (isDuplicate) {
    return events;
  }

  const normalizedEvent = {
    ...event,
    key,
    occurredAt,
  };

  if (event.status) {
    normalizedEvent.status = normalizeUnifiedStatus(event.status);
  }

  events.push(normalizedEvent);
  return events;
};

const createPendingUnifiedTransaction = async (input) => {
  const payload = input || {};
  const {
    credentialId,
    source,
    sourceTxnId,
    sourceParentId = null,
    providerTxnId = null,
    amount,
    currency = "INR",
    customerName = null,
    customerPhone = null,
    linkUrl = null,
    qrImageUrl = null,
    reference = null,
    purposeMessage = null,
    createdMilestoneAt,
    timelineEvents = [],
    rawPayload = {},
    timelineEvent,
  } = payload;

  if (!credentialId) throw new Error("credentialId is required");
  if (!sourceTxnId) throw new Error("sourceTxnId is required");
  if (amount === undefined || amount === null) throw new Error("amount is required");
  ensureSource(source);

  const createdAtDate = toDate(createdMilestoneAt);
  const createdEvent = timelineEvent || {
    key: "created",
    label: "Created",
    status: "PENDING",
    occurredAt: createdAtDate.toISOString(),
  };
  const finalTimeline = appendTimelineEvent(timelineEvents, createdEvent);

  const [transaction, created] = await paymentCollectionTransaction.findOrCreate({
    where: { source, sourceTxnId },
    defaults: {
      credentialId,
      source,
      sourceTxnId,
      sourceParentId,
      providerTxnId,
      status: "PENDING",
      amount,
      currency,
      customerName,
      customerPhone,
      linkUrl,
      qrImageUrl,
      reference,
      purposeMessage,
      createdMilestoneAt: createdAtDate,
      timelineEvents: finalTimeline,
      rawPayload: rawPayload && typeof rawPayload === "object" ? rawPayload : {},
    },
  });

  if (!created) {
    const nextEvents = appendTimelineEvent(transaction.timelineEvents, createdEvent);
    if (nextEvents.length !== (Array.isArray(transaction.timelineEvents) ? transaction.timelineEvents.length : 0)) {
      transaction.timelineEvents = nextEvents;
      await transaction.save();
    }
  }

  return { transaction, created };
};

const upsertUnifiedTransactionStatus = async (input) => {
  const payload = input || {};
  const {
    credentialId,
    source,
    sourceTxnId,
    sourceParentId = null,
    providerTxnId = null,
    status,
    amount,
    currency = "INR",
    customerName = null,
    customerPhone = null,
    linkUrl = null,
    qrImageUrl = null,
    reference = null,
    purposeMessage = null,
    createdMilestoneAt = null,
    occurredAt = null,
    rawPayload = null,
    event = null,
  } = payload;

  if (!sourceTxnId) throw new Error("sourceTxnId is required");
  if (!status) throw new Error("status is required");
  ensureSource(source);

  const normalizedStatus = normalizeUnifiedStatus(status);
  const occurredAtDate = toDate(occurredAt);
  const statusEvent = event || {
    key: `status_${normalizedStatus.toLowerCase()}`,
    label: `Status updated to ${normalizedStatus}`,
    status: normalizedStatus,
    occurredAt: occurredAtDate.toISOString(),
  };

  let transaction = await paymentCollectionTransaction.findOne({
    where: { source, sourceTxnId },
  });

  if (!transaction) {
    if (!credentialId) throw new Error("credentialId is required when upserting missing transaction");
    if (amount === undefined || amount === null) throw new Error("amount is required when upserting missing transaction");

    const timeline = appendTimelineEvent([], statusEvent);
    const createMilestoneAt = toDate(createdMilestoneAt || occurredAtDate);

    transaction = await paymentCollectionTransaction.create({
      credentialId,
      source,
      sourceTxnId,
      sourceParentId,
      providerTxnId,
      status: normalizedStatus,
      amount,
      currency,
      customerName,
      customerPhone,
      linkUrl,
      qrImageUrl,
      reference,
      purposeMessage,
      createdMilestoneAt: createMilestoneAt,
      outcomeMilestoneAt: OUTCOME_STATUSES.has(normalizedStatus) ? occurredAtDate : null,
      settledMilestoneAt: normalizedStatus === "SETTLED" ? occurredAtDate : null,
      timelineEvents: timeline,
      rawPayload: rawPayload && typeof rawPayload === "object" ? rawPayload : {},
    });

    return { transaction, created: true, updated: true };
  }

  let changed = false;

  if (normalizedStatus !== transaction.status) {
    transaction.status = normalizedStatus;
    changed = true;
  }

  if (providerTxnId && providerTxnId !== transaction.providerTxnId) {
    transaction.providerTxnId = providerTxnId;
    changed = true;
  }

  if (sourceParentId !== null && sourceParentId !== transaction.sourceParentId) {
    transaction.sourceParentId = sourceParentId;
    changed = true;
  }

  if (customerName !== null && customerName !== transaction.customerName) {
    transaction.customerName = customerName;
    changed = true;
  }

  if (customerPhone !== null && customerPhone !== transaction.customerPhone) {
    transaction.customerPhone = customerPhone;
    changed = true;
  }

  if (linkUrl !== null && linkUrl !== transaction.linkUrl) {
    transaction.linkUrl = linkUrl;
    changed = true;
  }

  if (qrImageUrl !== null && qrImageUrl !== transaction.qrImageUrl) {
    transaction.qrImageUrl = qrImageUrl;
    changed = true;
  }

  if (reference !== null && reference !== transaction.reference) {
    transaction.reference = reference;
    changed = true;
  }

  if (purposeMessage !== null && purposeMessage !== transaction.purposeMessage) {
    transaction.purposeMessage = purposeMessage;
    changed = true;
  }

  if (amount !== undefined && amount !== null && String(amount) !== String(transaction.amount)) {
    transaction.amount = amount;
    changed = true;
  }

  if (currency && currency !== transaction.currency) {
    transaction.currency = currency;
    changed = true;
  }

  if (!transaction.createdMilestoneAt) {
    transaction.createdMilestoneAt = toDate(createdMilestoneAt || occurredAtDate);
    changed = true;
  }

  if (OUTCOME_STATUSES.has(normalizedStatus) && !transaction.outcomeMilestoneAt) {
    transaction.outcomeMilestoneAt = occurredAtDate;
    changed = true;
  }

  if (normalizedStatus === "SETTLED" && !transaction.settledMilestoneAt) {
    transaction.settledMilestoneAt = occurredAtDate;
    changed = true;
  }

  const nextEvents = appendTimelineEvent(transaction.timelineEvents, statusEvent);
  if (nextEvents.length !== (Array.isArray(transaction.timelineEvents) ? transaction.timelineEvents.length : 0)) {
    transaction.timelineEvents = nextEvents;
    changed = true;
  }

  if (rawPayload && typeof rawPayload === "object") {
    transaction.rawPayload = {
      ...(transaction.rawPayload && typeof transaction.rawPayload === "object" ? transaction.rawPayload : {}),
      ...rawPayload,
    };
    changed = true;
  }

  if (changed) {
    await transaction.save();
  }

  return { transaction, created: false, updated: changed };
};

module.exports = {
  createPendingUnifiedTransaction,
  upsertUnifiedTransactionStatus,
  appendTimelineEvent,
  normalizeUnifiedStatus,
};
