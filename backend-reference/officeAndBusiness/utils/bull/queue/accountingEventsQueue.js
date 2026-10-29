"use strict";

const Queue = require("bull");
const {
    createBullClient,
    isTransientNetError,
} = require("../config/redisConnection");
const { customLog } = require("../../loggerHelper");

const QUEUE_NAME =
    process.env.ACCOUNTING_EVENTS_QUEUE_NAME || "accounting-events";

// Publisher-only handle. No .process() in this MS — the sharedServices worker drains it.
const accountingEventsQueue = new Queue(QUEUE_NAME, {
    createClient: (type) => createBullClient(type),
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
    },
});

accountingEventsQueue.on("ready", () => {
    customLog(null, "info", {
        message: "[BULL QUEUE] Accounting Events publisher ready",
        queue: QUEUE_NAME,
    });
});
accountingEventsQueue.on("error", (err) => {
    customLog(null, isTransientNetError(err) ? "warn" : "error", {
        message: "[BULL QUEUE] Accounting Events publisher error",
        queue: QUEUE_NAME,
        err: err?.message,
    });
});

/**
 * Fire-and-forget journal-events publisher.
 *
 * @param {Object} payload                  – the job payload
 * @param {string|number} payload.transactionRef
 * @param {"payment"|"refund"|"adminRefund"|"cashbackCredit"|"cashbackReversal"} payload.type
 * @param {Object} [payload.contextSnapshot]
 * @param {Object} [payload.amounts]
 * @param {Object} [payload.reportData]     – output of computeJournalData; the worker derives line items from reportData.journalData
 * @param {string} [payload.occurredAt]     – ISO; defaults to now
 * @param {string} [payload.sourceMs="officeAndBusiness"]
 * @param {string} [logTraceId]
 *
 * No return value. On failure the helper logs and swallows — payment flow must never block on journal recording.
 */
const publishJournalEvent = (
    {
        transactionRef,
        type,
        contextSnapshot,
        amounts,
        reportData,
        occurredAt,
        sourceMs = "officeAndBusiness",
    },
    logTraceId
) => {
    if (!transactionRef || !type) {
        customLog(logTraceId, "error", {
            message:
                "[publishJournalEvent] missing transactionRef or type — not enqueueing",
            transactionRef,
            type,
        });
        return;
    }

    accountingEventsQueue
        .add({
            domain: "journal",
            transactionRef: String(transactionRef),
            type,
            contextSnapshot: contextSnapshot || {},
            amounts: amounts || {},
            reportData: reportData || null,
            occurredAt: occurredAt || new Date().toISOString(),
            sourceMs,
        })
        .then((job) =>
            customLog(logTraceId, "info", {
                message: "[publishJournalEvent] enqueued",
                jobId: job.id,
                transactionRef,
                type,
            })
        )
        .catch((err) =>
            customLog(logTraceId, "error", {
                message: "[publishJournalEvent] enqueue failed",
                err: err?.message,
                transactionRef,
                type,
            })
        );
};

module.exports = { accountingEventsQueue, publishJournalEvent };
