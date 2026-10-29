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

module.exports = { accountingEventsQueue, dispatch };
