const Queue = require("bull");
const {
    createBullClient,
    isTransientNetError,
} = require("../config/redisConnection");
const { customLog } = require("../../loggerHelper");

const QUEUE_NAME =
    process.env.ACCOUNTING_EVENTS_QUEUE_NAME || "accounting-events";
const READS_QUEUE_NAME =
    process.env.ACCOUNTING_READS_QUEUE_NAME || "accounting-reads";
const JOURNAL_DISPATCH_TIMEOUT_MS =
    Number(process.env.JOURNAL_RETRY_DISPATCH_TIMEOUT_MS) || 30000;
const COA_DISPATCH_TIMEOUT_MS =
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

const accountingReadsQueue = new Queue(READS_QUEUE_NAME, {
    createClient: (type) => createBullClient(type),
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
    },
});

accountingReadsQueue.on("error", (err) => {
    customLog(null, isTransientNetError(err) ? "warn" : "error", {
        message: "[Accounting Reads Queue] error",
        queue: READS_QUEUE_NAME,
        err: err?.message,
    });
});

const READ_ACTIONS = new Set(["getAccountTypes", "getParentAccounts"]);

const waitFor = (job, timeoutMs, label) =>
    Promise.race([
        job.finished(),
        new Promise((_, reject) =>
            setTimeout(
                () =>
                    reject(new Error(`${label} timeout after ${timeoutMs}ms`)),
                timeoutMs
            )
        ),
    ]);

const dispatchJournalRetry = async (payload = {}) => {
    const job = await accountingEventsQueue.add({
        domain: "journal",
        ...payload,
    });
    return waitFor(
        job,
        JOURNAL_DISPATCH_TIMEOUT_MS,
        `[journal retry dispatch] type: ${payload.type}`
    );
};

const dispatch = async (action, params = {}) => {
    if (READ_ACTIONS.has(action)) {
        const job = await accountingReadsQueue.add({ action, ...params });
        return waitFor(
            job,
            COA_DISPATCH_TIMEOUT_MS,
            `[COA dispatch] action: ${action}`
        );
    }

    const job = await accountingEventsQueue.add({
        domain: "coa",
        action,
        ...params,
    });
    return waitFor(
        job,
        COA_DISPATCH_TIMEOUT_MS,
        `[COA dispatch] action: ${action}`
    );
};

module.exports = {
    accountingEventsQueue,
    accountingReadsQueue,
    dispatchJournalRetry,
    dispatch,
};
