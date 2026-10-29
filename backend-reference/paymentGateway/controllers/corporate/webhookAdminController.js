const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const {
  listWebhookEvents,
  findWebhookById,
  markWebhookProcessed,
  markWebhookFailed,
  deleteWebhookEvents,
} = require("../../models/use-cases/webhookEvent");

const MAX_RETRIES = 2;

/**
 * GET /api/v1/system_user/:userId/ni-payments/webhooks
 * Single list endpoint — filter via query params:
 * - status: PENDING | PROCESSED | FAILED
 * - webhookSource: default inbox is peko_subscriptions; omit to list all sources
 * - webhookContext: SUBSCRIPTION_AUTH | SUBSCRIPTION_CHARGE (from payment webhooks)
 * - eventType, vendorSubscriptionId, fromDate, toDate, page, limit, sortOrder (asc|desc)
 *
 * Failed renewal attempts: status=FAILED&webhookContext=SUBSCRIPTION_CHARGE
 */
exports.listWebhooks = asyncHandler(async (req, res) => {
  const {
    status,
    eventType,
    webhookContext,
    webhookSource,
    vendorSubscriptionId,
    fromDate,
    toDate,
    page,
    limit,
    sortOrder,
  } = req.query;

  // F-PG-21: the dates are used in the SQL query, so only a plain YYYY-MM-DD date is accepted.
  const isValidDate = (value) => value === undefined || value === "" || /^\d{4}-\d{2}-\d{2}$/.test(String(value));
  if (!isValidDate(fromDate) || !isValidDate(toDate)) {
    return res.status(400).json({
      status: false,
      message: "Invalid date. Use the format YYYY-MM-DD.",
      responseCode: "001",
      data: {},
    });
  }

  customLog(req?.LogTraceId, "info", {
    message: "Admin: listing webhook events",
    adminUserId: req?.user?.id,
    adminUsername: req?.user?.username,
    filters: { status, eventType, webhookContext, webhookSource, vendorSubscriptionId, fromDate, toDate, page, limit, sortOrder },
  });

  const result = await listWebhookEvents({
    status,
    eventType,
    webhookContext,
    webhookSource,
    vendorSubscriptionId,
    fromDate,
    toDate,
    page,
    limit,
    sortOrder,
  });

  customLog(req?.LogTraceId, "info", {
    message: "Admin: webhook events listed",
    adminUserId: req?.user?.id,
    total: result?.total,
    returned: result?.data?.length ?? 0,
  });

  return res.status(200).json({
    status: true,
    message: 'Webhook events fetched successfully.',
    responseCode: '000',
    data: result,
  });
});

/**
 * DELETE /api/v1/system_user/:userId/payment-gateway/cashfree-payments/webhooks
 * Query params:
 *   status        — PROCESSED | FAILED | PENDING | ALL (required)
 *   olderThanDays — only delete records older than N days (optional)
 */
exports.clearWebhooks = asyncHandler(async (req, res, next) => {
  const { status, olderThanDays } = req.query;

  customLog(req?.LogTraceId, "info", {
    message: "Admin: clearWebhooks requested",
    adminUserId: req?.user?.id,
    adminUsername: req?.user?.username,
    requestedStatus: status,
    olderThanDays,
  });

  const allowed = ['PROCESSED', 'FAILED', 'PENDING', 'ALL'];
  if (!status || !allowed.includes(status.toUpperCase())) {
    customLog(req?.LogTraceId, "info", {
      message: "Admin: clearWebhooks rejected — invalid status",
      adminUserId: req?.user?.id,
      requestedStatus: status,
      allowed,
    });
    return next(new ErrorResponse(`'status' is required and must be one of: ${allowed.join(', ')}`, 400));
  }

  const deleted = await deleteWebhookEvents({ status, olderThanDays: olderThanDays || null });

  customLog(req?.LogTraceId, "info", {
    message: "Admin: webhook events cleared",
    adminUserId: req?.user?.id,
    status,
    olderThanDays,
    deleted,
  }, "VENDOR");

  return res.status(200).json({
    status: true,
    message: `${deleted} webhook event(s) deleted.`,
    responseCode: '000',
    data: { deleted },
  });
});

// POST /api/v1/system_user/:userId/ni-payments/webhooks/:id/retry
//
// Admin-triggered manual reprocessing of a FAILED webhook event. Logs heavily so any retry
// attempt is auditable end-to-end — admin identity, original failure context, retry outcome.
// On retry-failure we ALSO mirror to console.error so we never lose the cause to Logtail blips.
exports.retryWebhook = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const traceId = req?.LogTraceId;
  const adminUserId = req?.user?.id;
  const adminUsername = req?.user?.username;

  customLog(traceId, "info", {
    message: "Admin: webhook retry requested",
    adminUserId,
    adminUsername,
    webhookEventId: id,
  });

  const webhookEvent = await findWebhookById(id);
  if (!webhookEvent) {
    customLog(traceId, "info", {
      message: "Admin: webhook retry rejected — event not found",
      adminUserId,
      webhookEventId: id,
    });
    return next(new ErrorResponse("Webhook event not found", 404));
  }

  if (webhookEvent.status !== "FAILED") {
    customLog(traceId, "info", {
      message: "Admin: webhook retry rejected — only FAILED events can be retried",
      adminUserId,
      webhookEventId: id,
      currentStatus: webhookEvent.status,
      eventType: webhookEvent.eventType,
    });
    return next(new ErrorResponse(`Cannot retry webhook with status '${webhookEvent.status}'. Only FAILED events can be retried.`, 400));
  }

  if (webhookEvent.retryCount >= MAX_RETRIES) {
    customLog(traceId, "info", {
      message: "Admin: webhook retry rejected — max retries reached",
      adminUserId,
      webhookEventId: id,
      eventType: webhookEvent.eventType,
      currentRetryCount: webhookEvent.retryCount,
      maxRetries: MAX_RETRIES,
      lastProcessingError: webhookEvent.processingError,
    });
    return next(new ErrorResponse(`Max retries (${MAX_RETRIES}) reached for this webhook. Manual investigation required.`, 400));
  }

  customLog(traceId, "info", {
    message: "Admin: retrying FAILED webhook",
    adminUserId,
    adminUsername,
    webhookEventId: id,
    eventType: webhookEvent.eventType,
    webhookContext: webhookEvent.webhookContext,
    vendorSubscriptionId: webhookEvent.vendorSubscriptionId,
    merchantPaymentId: webhookEvent.merchantPaymentId,
    currentRetryCount: webhookEvent.retryCount,
    previousProcessingError: webhookEvent.processingError,
  }, "VENDOR");

  const { processWebhookEventById } = require("./cashFreeGateway");

  try {
    await processWebhookEventById(webhookEvent, traceId);
    await markWebhookProcessed(webhookEvent.id);
    customLog(traceId, "info", {
      message: "Admin: webhook retry succeeded",
      adminUserId,
      webhookEventId: id,
      eventType: webhookEvent.eventType,
      newStatus: "PROCESSED",
    }, "VENDOR");
    return res.status(200).json({
      status: true,
      message: 'Webhook reprocessed successfully.',
      responseCode: '000',
      data: { id: webhookEvent.id, eventType: webhookEvent.eventType },
    });
  } catch (error) {
    const newRetryCount = webhookEvent.retryCount + 1;
    const errorPayload = {
      message: "Admin: webhook retry failed",
      adminUserId,
      adminUsername,
      webhookEventId: id,
      eventType: webhookEvent.eventType,
      newRetryCount,
      maxRetries: MAX_RETRIES,
      retryExhausted: newRetryCount >= MAX_RETRIES,
      errorMessage: error?.message ?? String(error),
      errorStack: error?.stack,
      errorResponse: error?.response?.data,
    };
    customLog(traceId, "error", errorPayload, "VENDOR");
    console.error("[retryWebhook] retry failed", JSON.stringify(errorPayload));
    try {
      await markWebhookFailed(webhookEvent.id, error?.message ?? String(error), newRetryCount);
    } catch (markErr) {
      customLog(traceId, "error", {
        message: "Admin: failed to mark webhook FAILED after retry error",
        webhookEventId: id,
        markError: markErr?.message ?? markErr,
      }, "VENDOR");
      console.error("[retryWebhook] markWebhookFailed also threw", markErr?.message);
    }
    return next(new ErrorResponse(`Retry failed: ${error?.message ?? "Unknown error"}`, 500));
  }
});
