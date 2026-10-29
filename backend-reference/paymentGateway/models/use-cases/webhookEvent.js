const { Op, Sequelize } = require('sequelize');
const WebhookEvent = require('../entities/webhookEvent');
const asyncHandler = require('../../middlewares/async');

exports.getNextWebhookEventSequence = async (vendorSubscriptionId, webhookSource = 'peko_subscriptions') => {
  if (!vendorSubscriptionId) return null;
  const maxSeq = await WebhookEvent.max('eventSequence', {
    where: {
      vendorSubscriptionId: String(vendorSubscriptionId),
      webhookSource,
    },
  });
  return (maxSeq || 0) + 1;
};

// Atomically find or create a webhook event by idempotencyKey.
// Returns [instance, created] — if created=false the event is a duplicate and must not be reprocessed.
exports.findOrCreateWebhookEvent = asyncHandler(async ({
  idempotencyKey,
  eventType,
  payload,
  vendorSubscriptionId,
  merchantPaymentId,
  eventSequence,
  webhookContext,
  webhookSource = 'peko_subscriptions',
}) => {
  return await WebhookEvent.findOrCreate({
    where: { idempotencyKey },
    defaults: {
      eventType,
      payload,
      status: 'PENDING',
      retryCount: 0,
      vendorSubscriptionId: vendorSubscriptionId ?? null,
      merchantPaymentId: merchantPaymentId ?? null,
      eventSequence: eventSequence ?? null,
      webhookContext: webhookContext ?? null,
      webhookSource,
    },
  });
});

exports.markWebhookProcessed = asyncHandler(async (id) => {
  return await WebhookEvent.update(
    { status: 'PROCESSED', lastProcessedAt: new Date() },
    { where: { id } }
  );
});

exports.markWebhookFailed = asyncHandler(async (id, processingError, retryCount) => {
  return await WebhookEvent.update(
    { status: 'FAILED', processingError, retryCount, lastProcessedAt: new Date() },
    { where: { id } }
  );
});

exports.findWebhookById = asyncHandler(async (id) => {
  return await WebhookEvent.findOne({ where: { id } });
});

/**
 * Delete webhook events by status and/or age.
 * @param {string} status - 'PROCESSED' | 'FAILED' | 'PENDING' | 'ALL'
 * @param {number|null} olderThanDays - if provided, only delete records older than N days
 * Returns the number of rows deleted.
 */
exports.deleteWebhookEvents = asyncHandler(async ({ status, olderThanDays } = {}) => {
  const where = {};

  if (status && status.toUpperCase() !== 'ALL') {
    where.status = status.toUpperCase();
  }

  if (olderThanDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(olderThanDays));
    where.createdAt = { [Op.lt]: cutoff };
  }

  const deleted = await WebhookEvent.destroy({ where });
  return deleted;
});

// List webhook events with optional filters — used by admin API (single endpoint + query filters)
exports.listWebhookEvents = asyncHandler(async ({
  status,
  eventType,
  fromDate,
  toDate,
  vendorSubscriptionId,
  webhookContext,
  webhookSource,
  page = 1,
  limit = 20,
  sortOrder = 'desc',
}) => {
  const where = {};

  if (status) where.status = status;
  if (eventType) where.eventType = eventType;
  if (webhookContext) where.webhookContext = webhookContext;
  if (webhookSource) where.webhookSource = String(webhookSource);
  if (vendorSubscriptionId) where.vendorSubscriptionId = String(vendorSubscriptionId);
  // F-PG-21: only a plain YYYY-MM-DD value may reach the SQL literal (the controller also rejects others).
  const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
  const safeFrom = fromDate && DATE_ONLY.test(String(fromDate)) ? String(fromDate) : null;
  const safeTo = toDate && DATE_ONLY.test(String(toDate)) ? String(toDate) : null;
  if (safeFrom || safeTo) {
    where.createdAt = {};
    if (safeFrom) where.createdAt[Op.gte] = Sequelize.literal(`'${safeFrom} 00:00:00'`);
    if (safeTo) where.createdAt[Op.lte] = Sequelize.literal(`'${safeTo} 23:59:59'`);
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const dir = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const order =
    vendorSubscriptionId
      ? [
          ['eventSequence', 'ASC'],
          ['createdAt', 'ASC'],
        ]
      : [['createdAt', dir]];

  const { count, rows } = await WebhookEvent.findAndCountAll({
    where,
    order,
    limit: parseInt(limit),
    offset,
  });

  return {
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    data: rows,
  };
});
