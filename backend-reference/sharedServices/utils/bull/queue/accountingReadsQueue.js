const Queue = require("bull");
const {
    createBullClient,
    isTransientNetError,
} = require("../config/redisConnection");
const { customLog } = require("../../loggerHelper");

const QUEUE_NAME =
    process.env.ACCOUNTING_READS_QUEUE_NAME || "accounting-reads";

const accountingReadsQueue = new Queue(QUEUE_NAME, {
    createClient: (type) => createBullClient(type),
    defaultJobOptions: {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: true,
    },
});

accountingReadsQueue.on("ready", () => {
    customLog(null, "info", {
        message: "[BULL QUEUE] Accounting Reads ready",
        queue: QUEUE_NAME,
    });
});
accountingReadsQueue.on("error", (err) => {
    customLog(null, isTransientNetError(err) ? "warn" : "error", {
        message: "[BULL QUEUE] Accounting Reads error",
        queue: QUEUE_NAME,
        err: err?.message,
    });
});

module.exports = accountingReadsQueue;
