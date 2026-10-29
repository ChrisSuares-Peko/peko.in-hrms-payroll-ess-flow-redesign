const accountingReadsQueue = require("../queue/accountingReadsQueue");
const { customLog } = require("../../loggerHelper");
const { getAccountingProvider } = require("../../providers");

const READ_CONCURRENCY = Number(process.env.ACCOUNTING_READ_CONCURRENCY || 3);

const buildReadActionMap = (coa) => ({
    getAccountTypes: () => coa.getAccountTypes(),
    getParentAccounts: () => coa.getParentAccounts(),
});

accountingReadsQueue.process(READ_CONCURRENCY, async (job) => {
    const traceId = job.id?.toString();
    const { action, ...params } = job.data || {};

    const provider = getAccountingProvider();
    const actionMap = buildReadActionMap(provider.chartOfAccounts);

    if (!action || !actionMap[action]) {
        customLog(traceId, "error", {
            message: "[accountingReadsWorker] unknown action",
            action,
            jobId: job.id,
        });
        return { skipped: true, reason: "unknown-action" };
    }

    customLog(traceId, "info", {
        message: "[accountingReadsWorker] processing",
        action,
        provider: provider.name,
        jobId: job.id,
    });

    const result = await actionMap[action](params);

    customLog(traceId, "info", {
        message: "[accountingReadsWorker] done",
        action,
        provider: provider.name,
        jobId: job.id,
    });

    return result;
});

customLog(null, "info", { message: "[accountingReadsWorker] Worker started" });

module.exports = accountingReadsQueue;
