"use strict";

// One queue for everything Zoho-bound (journal postings + chart-of-accounts
// ops). Merged from journalEventsQueue + chartOfAccountsQueue so a "create
// account" job and a later "post journal referencing that account" job stay
// in the same FIFO line — two separate queues could let the journal job jump
// ahead of the account it depends on.
const Queue = require("bull");
const {
    createBullClient,
    isTransientNetError,
} = require("../config/redisConnection");
const { customLog } = require("../../loggerHelper");

const QUEUE_NAME =
    process.env.ACCOUNTING_EVENTS_QUEUE_NAME || "accounting-events";

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
        message: "[BULL QUEUE] Accounting Events ready",
        queue: QUEUE_NAME,
    });
});
accountingEventsQueue.on("error", (err) => {
    customLog(null, isTransientNetError(err) ? "warn" : "error", {
        message: "[BULL QUEUE] Accounting Events error",
        queue: QUEUE_NAME,
        err: err?.message,
    });
});

module.exports = accountingEventsQueue;
