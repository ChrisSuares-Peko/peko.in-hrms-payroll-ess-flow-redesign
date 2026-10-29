// Thin adapter over the merged accounting-events queue (journal postings +
// chart-of-accounts ops, see ../queue/accountingEventsQueue). Every job carries
// a top-level `domain: "journal" | "coa"` set by the publisher — we just route
// on that, then hand off to the same per-domain logic the two separate
// workers used to run.
const accountingEventsQueue = require("../queue/accountingEventsQueue");
const { customLog } = require("../../loggerHelper");
const {
    recordJournal,
    recordRefund,
    recordCashbackCredit,
    recordCashbackReversal,
    recordAdminRefund,
    recordWalletTransfer,
    recordDirectLineItems,
} = require("../../journal/recordJournal");
const { buildJournalPreview, recordManualJournal } = require("../../journal/manualJournal");
const { getAccountingProvider } = require("../../providers");
const {
    finalizeSyncStatus,
} = require("../../../models/use-cases/chartOfAccount");

// Publish-side event type → which recording function handles it. Each function
// hardcodes its own persistence key internally (mirroring Peko-AE's JOURNAL_TYPES).
const JOURNAL_TYPE_TO_HANDLER = {
    payment: recordJournal,
    refund: recordRefund,
    cashbackCredit: recordCashbackCredit,
    cashbackReversal: recordCashbackReversal,
    adminRefund: recordAdminRefund,
    walletTransfer: recordWalletTransfer,
};

const buildCoaActionMap = (coa) => ({
    create: ({ payload }) => coa.create(payload),
    update: async ({ accountId, payload }) => {
        // A create that failed has no provider id yet, so resubmitting it creates the account.
        const existing = accountId ? await coa.getById(accountId) : null;
        return existing ? coa.update(accountId, payload) : coa.create(payload);
    },
});

const journalContextOf = (data, corporateTxnId) => {
    const contextSnapshot = data.contextSnapshot || {};
    return {
        reportData: data.reportData,
        corporateTxnId,
        vendor: data.vendor || contextSnapshot.vendor || null,
        paymentGatewayName:
            data.paymentGatewayName ||
            data.reportData?.journalData?.paymentGatewayName ||
            null,
        credentialId: data.credentialId || contextSnapshot.credentialId || null,
        registeredBy: data.registeredBy || contextSnapshot.registeredBy || null,
        occurredAt: data.occurredAt || null,
        amount: data.amounts?.amount ?? data.amount ?? null,
        refundAmount: data.amounts?.refundAmount ?? null,
        totalOrderAmount: data.amounts?.totalOrderAmount ?? null,
        direction: data.direction || contextSnapshot.direction || null,
    };
};

const processJournalJob = async (job, traceId) => {
    const data = job.data || {};
    const corporateTxnId = data.corporateTxnId || data.transactionRef;
    const eventType = data.type || "payment";

    if (!corporateTxnId) {
        customLog(traceId, "error", {
            message: "[accountingEventsWorker/journal] missing corporateTxnId",
            jobId: job.id,
        });
        return { skipped: true, reason: "missing-keys" };
    }

    if (eventType === "journalPreview") {
        if (!data.journalKey) return { ok: false, reason: "missing-journal-key" };
        return buildJournalPreview(journalContextOf(data, corporateTxnId), data.journalKey);
    }

    if (eventType === "manualJournal") {
        if (!data.journalKey) return { success: false, reason: "missing-journal-key" };
        return recordManualJournal(
            {
                corporateTxnId,
                mode: data.mode,
                lineItems: data.lineItems,
                journalDate: data.journalDate,
                journalData: data.journalData,
                journalAccountIds: data.journalAccountIds,
                actor: data.actor,
                reason: data.reason,
            },
            data.journalKey
        );
    }

    if (eventType === "directRepost") {
        if (!data.journalKey) {
            customLog(traceId, "error", {
                message:
                    "[accountingEventsWorker/journal] directRepost missing journalKey",
                jobId: job.id,
            });
            return { skipped: true, reason: "missing-journal-key" };
        }
        const directResult = await recordDirectLineItems(
            {
                corporateTxnId,
                lineItems: data.lineItems,
                occurredAt: data.occurredAt,
            },
            data.journalKey,
            data.notesLabel || "Journal entry"
        );
        if (!directResult.success) {
            throw new Error(
                `Direct journal repost failed for ${corporateTxnId}${
                    directResult.error ? ` — ${directResult.error}` : ""
                }`
            );
        }
        return directResult;
    }

    const handler = JOURNAL_TYPE_TO_HANDLER[eventType];
    if (!handler) {
        customLog(traceId, "error", {
            message:
                "[accountingEventsWorker/journal] no handler registered for event type",
            eventType,
            jobId: job.id,
        });
        return { skipped: true, reason: `unhandled-type:${eventType}` };
    }

    const result = await handler(journalContextOf(data, corporateTxnId));

    // Throw on hard failures so Bull retries (skips are terminal, not errors).
    if (!result.success && !result.skipped) {
        throw new Error(
            `Journal recording failed for ${corporateTxnId}${
                result.reason ? ` — ${result.reason}` : ""
            }`
        );
    }

    return result;
};

const SYNC_STATUS_ACTIONS = new Set(["create", "update"]);

const processCoaJob = async (job, traceId) => {
    const { action, localId, ...params } = job.data || {};

    const provider = getAccountingProvider();
    const actionMap = buildCoaActionMap(provider.chartOfAccounts);

    if (!action || !actionMap[action]) {
        customLog(traceId, "error", {
            message: "[accountingEventsWorker/coa] unknown action",
            action,
            jobId: job.id,
        });
        return { skipped: true, reason: "unknown-action" };
    }

    customLog(traceId, "info", {
        message: "[accountingEventsWorker/coa] processing",
        action,
        provider: provider.name,
        jobId: job.id,
    });

    let result;
    try {
        result = await actionMap[action](params);
    } catch (error) {
        if (SYNC_STATUS_ACTIONS.has(action)) {
            await finalizeSyncStatus(localId, action, null);
        }
        throw error;
    }

    if (SYNC_STATUS_ACTIONS.has(action)) {
        await finalizeSyncStatus(localId, action, result);
    }

    customLog(traceId, "info", {
        message: "[accountingEventsWorker/coa] done",
        action,
        provider: provider.name,
        jobId: job.id,
    });

    return result;
};

accountingEventsQueue.process(async (job) => {
    const traceId = job.id?.toString();
    const domain = job.data?.domain;

    if (domain === "coa") return processCoaJob(job, traceId);
    if (domain === "journal") return processJournalJob(job, traceId);

    customLog(traceId, "error", {
        message: "[accountingEventsWorker] missing/unknown domain on job",
        domain,
        jobId: job.id,
    });
    return { skipped: true, reason: `unknown-domain:${domain}` };
});

// Bull fails a job that stalls past its limit without running the processor above,
// so its sync status would stay pending forever.
accountingEventsQueue.on("failed", async (job, err) => {
    const { domain, action, localId } = job?.data || {};
    if (domain !== "coa" || !SYNC_STATUS_ACTIONS.has(action)) return;
    if (!err?.message?.includes("stalled")) return;

    try {
        await finalizeSyncStatus(localId, action, null);
    } catch (error) {
        customLog(null, "error", {
            message: "[accountingEventsWorker/coa] could not mark stalled job failed",
            action,
            localId,
            error: error?.message,
        });
    }
});

customLog(null, "info", { message: "[accountingEventsWorker] Worker started" });

module.exports = accountingEventsQueue;
