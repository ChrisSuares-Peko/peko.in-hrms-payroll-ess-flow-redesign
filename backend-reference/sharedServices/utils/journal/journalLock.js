const { client } = require("../cacheDataMethods");
const { customLog } = require("../loggerHelper");

const LOCK_TTL_SECONDS = 30;

const lockKeyFor = (corporateTxnId, key) => `journal-lock:${corporateTxnId}:${key}`;

// Fails open if Redis is unreachable, since Bull already needs it to dispatch the job.
const acquireJournalLock = async (corporateTxnId, key) => {
    try {
        const result = await client.set(lockKeyFor(corporateTxnId, key), "1", {
            NX: true,
            EX: LOCK_TTL_SECONDS,
        });
        return result === "OK";
    } catch (error) {
        customLog(null, "error", {
            message: "Failed to acquire journal lock — proceeding without it",
            corporateTxnId,
            key,
            error: error?.message,
        });
        return true;
    }
};

const releaseJournalLock = async (corporateTxnId, key) => {
    try {
        await client.del(lockKeyFor(corporateTxnId, key));
    } catch (error) {
        customLog(null, "error", {
            message: "Failed to release journal lock",
            corporateTxnId,
            key,
            error: error?.message,
        });
    }
};

module.exports = { acquireJournalLock, releaseJournalLock };
