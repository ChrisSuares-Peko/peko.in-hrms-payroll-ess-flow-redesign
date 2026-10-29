const Queue = require("bull");
const {
    createBullClient,
    isTransientNetError,
} = require("../config/redisConnection");
const { customLog } = require("../../loggerHelper");

const QUEUE_NAME =
    process.env.ACCOUNTING_EVENTS_QUEUE_NAME || "accounting-events";
const DISPATCH_TIMEOUT_MS =
    Number(process.env.COA_DISPATCH_TIMEOUT_MS) || 30000;

const accountingEventsQueue = new Queue(QUEUE_NAME, {
    createClient: (type) => createBullClient(type),
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
    },
});

accountingEventsQueue.on("error", (err) => {
    customLog(null, isTransientNetError(err) ? "warn" : "error", {
        message: "[Accounting Events Queue] error",
        queue: QUEUE_NAME,
        err: err?.message,
    });
});

const dispatch = async (action, params = {}) => {
    const job = await accountingEventsQueue.add({
        domain: "coa",
        action,
        ...params,
    });

    return Promise.race([
        job.finished(),
        new Promise((_, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(
                            `[COA dispatch] timeout after ${DISPATCH_TIMEOUT_MS}ms — action: ${action}`
                        )
                    ),
                DISPATCH_TIMEOUT_MS
            )
        ),
    ]);
};

// Fire-and-forget journal-events publisher (mirrors paymentGateway's), so this MS
// can enqueue "journal" domain jobs for the shared sharedServices worker to record.
const publishJournalEvent = (
    {
        transactionRef,
        type,
        contextSnapshot,
        amounts,
        reportData,
        occurredAt,
        sourceMs = "travel",
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

module.exports = { accountingEventsQueue, dispatch, publishJournalEvent };
