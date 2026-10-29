const { customLog } = require("../loggerHelper");
const { getAccountingProvider } = require("../providers");
const {
    buildTransactionLineItems,
    buildRefundLineItems,
    buildCashbackLineItems,
    buildCashbackReversalLineItems,
    buildAdminRefundLineItems,
    buildWalletTransferLineItems,
    applyRoundingAdjustment,
} = require("./lineItemBuilder");
const {
    persistJournalRecord,
    findByCorporateTxnId,
} = require("../../models/use-cases/order");
const { isJournalRecordingEnabled, getGstRatePct } = require("../../models/use-cases/setting");
const { acquireJournalLock, releaseJournalLock } = require("./journalLock");
const { splitFromLines, accountNamesById } = require("./manualJournal");
const walletTransaction = require("../../models/entities/transaction");

const WALLET_JOURNAL_KEYS = new Set(["cashback", "cashbackReversal"]);

// Journals are dated by the Indian calendar day: an order paid at 2 am IST is still "yesterday" in UTC.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const istDay = value => new Date(new Date(value).getTime() + IST_OFFSET_MS).toISOString().split("T")[0];

const walletTransferStore = {
    find: (corporateTxnId, credentialId) =>
        walletTransaction.findOne({
            where: { corporateTxnId, credentialId },
            attributes: ["journalData", "journalRecordStatus"],
            raw: true,
        }),
    persist: async (corporateTxnId, credentialId, key, { payload, recorded, reason }) => {
        const existing = await walletTransaction.findOne({
            where: { corporateTxnId, credentialId },
            attributes: ["journalData", "journalRecordStatus"],
            raw: true,
        });
        if (!existing) return;
        const journalData = { ...(existing.journalData || {}) };
        if (payload) journalData[key] = reason ? { ...payload, reason } : payload;
        await walletTransaction.update(
            {
                journalData,
                journalRecordStatus: { ...(existing.journalRecordStatus || {}), [key]: recorded },
            },
            { where: { corporateTxnId, credentialId } }
        );
    },
};

const logJournalPayload = (corporateTxnId, lineItems, journalDate) => {
    const totalDebits = lineItems.reduce(
        (s, i) => s + (i.direction === "debit" ? Number(i.amount) : 0),
        0
    );
    const totalCredits = lineItems.reduce(
        (s, i) => s + (i.direction === "credit" ? Number(i.amount) : 0),
        0
    );
    customLog(null, "info", {
        message: "[recordJournal] payload before provider call",
        corporateTxnId,
        journalDate,
        lineItemCount: lineItems.length,
        totalDebits,
        totalCredits,
        balanced: Math.abs(totalDebits - totalCredits) < 0.01,
    });
};

// Carries refundAmount/totalOrderAmount/amount onto every persisted payload so a later
// retry can read them back instead of needing them re-supplied.
const amountExtras = (context) => {
    const extras = {};
    if (context?.refundAmount != null) extras.refundAmount = context.refundAmount;
    if (context?.totalOrderAmount != null) extras.totalOrderAmount = context.totalOrderAmount;
    if (context?.amount != null) extras.amount = context.amount;
    return extras;
};

// Persists a not-sent attempt (build failed, or a precondition blocked sending) as false.
const persistNotRecorded = async (corporateTxnId, key, reason, payload, journalAccountIds, persistFn) => {
    customLog(null, "error", {
        message: "Journal entry not recorded",
        reason,
        corporateTxnId,
        key,
    });
    await (persistFn || (details => persistJournalRecord(corporateTxnId, key, details)))({
        payload: { ...payload, skipped: true, reason },
        recorded: false,
        journalAccountIds,
        reason,
    });
    return { success: false, skipped: true, reason };
};

// Back-compat shorthand for the (no line items built yet) case.
const skipJournal = (corporateTxnId, key, reason, extra = {}) =>
    persistNotRecorded(corporateTxnId, key, reason, extra, undefined);

// context: { reportData, corporateTxnId, vendor, paymentGatewayName, credentialId, registeredBy, occurredAt }
const runJournalRecording = async (context, buildFn, key, notesLabel) => {
    const {
        reportData,
        corporateTxnId,
        vendor,
        paymentGatewayName,
        credentialId,
        registeredBy = null,
        occurredAt,
        amount,
        refundAmount,
        totalOrderAmount,
        direction,
        journalTarget,
    } = context || {};

    const isWalletTransfer = journalTarget === "walletTransfer";
    const store = isWalletTransfer ? walletTransferStore : null;
    const findExisting = () =>
        store
            ? store.find(corporateTxnId, credentialId)
            : findByCorporateTxnId(corporateTxnId, ["journalRecordStatus"]);
    const persist = (details) =>
        store
            ? store.persist(corporateTxnId, credentialId, key, details)
            : persistJournalRecord(corporateTxnId, key, details);

    const extras = amountExtras(context);

    const gotLock = await acquireJournalLock(corporateTxnId, key);
    if (!gotLock) {
        return {
            success: false,
            locked: true,
            reason: "Another attempt to record this journal is already in progress",
        };
    }

    try {
        const existingOrder = await findExisting();
        if (existingOrder?.journalRecordStatus?.[key] === true) {
            customLog(null, "info", {
                message: `[JOURNAL IDEMPOTENCY] ${key} recording skipped — already recorded for this transaction`,
                corporateTxnId,
                key,
            });
            return { success: true, skipped: true, reason: "already-recorded" };
        }

        // Skip before build: commission/surcharge not yet set up via the Accounting Portal.
        const notConfiguredReason = reportData?.journalData?.commissionNotConfiguredFor
            ? `Commission not configured for "${reportData.journalData.commissionNotConfiguredFor}"`
            : reportData?.journalData?.surchargeNotConfiguredFor
                ? `Surcharge not configured for "${reportData.journalData.surchargeNotConfiguredFor}"`
                : null;
        if (notConfiguredReason) {
            return persistNotRecorded(corporateTxnId, key, notConfiguredReason, extras, undefined, persist);
        }

        // Build happens next, regardless of the pause/toggle checks further below.
        let built;
        try {
            built = await buildFn({
                journalData: reportData?.journalData,
                corporateTxnId,
                vendor,
                paymentGatewayName,
                credentialId,
                registeredBy,
                amount,
                refundAmount,
                totalOrderAmount,
                direction,
            });
        } catch (buildError) {
            const failureReason =
                buildError?.message || "Unexpected error while building the journal";
            customLog(null, "error", {
                message: "An error occurred while building the journal",
                corporateTxnId,
                key,
                reason: failureReason,
            });
            return persistNotRecorded(corporateTxnId, key, failureReason, extras, undefined, persist);
        }

        if (!built.ok) {
            return persistNotRecorded(corporateTxnId, key, built.reason, extras, undefined, persist);
        }

        const journalDate = istDay(occurredAt || new Date());
        const payloadBase = {
            journalDate,
            referenceNumber: corporateTxnId,
            notes: `${notesLabel} for corporate transaction ${corporateTxnId}`,
            lineItems: built.lineItems,
            ...(built.journalAccountNames ? { accountNames: built.journalAccountNames } : {}),
            ...extras,
        };

        let blockReason = null;
        if (!(await isJournalRecordingEnabled())) {
            blockReason = "Journal recording is currently paused";
        } else if (reportData && !reportData?.journalData?.recordJournalEntry) {
            blockReason = "recordJournalEntry is disabled for this service operator";
        } else if (key === "adminRefund" && existingOrder?.journalRecordStatus?.transaction !== true) {
            blockReason = "Transaction journal has not been recorded successfully yet";
        }

        if (blockReason) {
            // journalAccountIds is a shared slot on the order — only relevant for the
            // types Admin Refund depends on, not the unrelated wallet-journal shape.
            const accountIdsToPersist = WALLET_JOURNAL_KEYS.has(key) ? undefined : built.journalAccountIds;
            return persistNotRecorded(corporateTxnId, key, blockReason, payloadBase, accountIdsToPersist, persist);
        }

        logJournalPayload(corporateTxnId, built.lineItems, journalDate);

        const provider = getAccountingProvider();
        const result = await provider.journal.recordJournal(payloadBase);

        // The provider was actually called, so this is Recorded/Failed — never "Skipped".
        // On failure the provider's reason rides along onto journalData[key].reason.
        const failureReason = result.success
            ? undefined
            : result.error || "Provider rejected the journal entry";

        await persist({
            payload: {
                ...payloadBase,
                provider: provider.name,
                ...(result.success ? { providerJournalId: result.providerJournalId } : {}),
            },
            recorded: !!result.success,
            journalAccountIds: WALLET_JOURNAL_KEYS.has(key) ? undefined : built.journalAccountIds,
            reason: failureReason,
        });

        if (result.success) {
            customLog(null, "info", {
                message: "Journal recorded",
                corporateTxnId,
                provider: provider.name,
                providerJournalId: result.providerJournalId,
            });
            return {
                success: true,
                providerJournalId: result.providerJournalId,
            };
        }
        customLog(null, "info", {
            message: "Journal entry not recorded by provider",
            corporateTxnId,
            provider: provider.name,
            reason: failureReason,
        });
        return {
            success: false,
            providerJournalId: null,
            reason: failureReason,
        };
    } catch (error) {
        const failureReason =
            error?.response?.data?.message ||
            error?.message ||
            "Unexpected error while recording the journal";
        customLog(null, "error", {
            message: "An error occurred while recording the journal",
            corporateTxnId,
            key,
            reason: failureReason,
        });
        await persist({
            payload: { skipped: true, reason: failureReason, ...extras },
            recorded: false,
            reason: failureReason,
        });
        return { success: false, error: failureReason, reason: failureReason };
    } finally {
        await releaseJournalLock(corporateTxnId, key);
    }
};

// Records the success journal for a transaction (persists under "transaction").
const recordJournal = (context) =>
    runJournalRecording(
        context,
        buildTransactionLineItems,
        "transaction",
        "Journal entry"
    );

// Records a refund journal — reverses the original transaction's accounting
// (persists under "refund").
const recordRefund = (context) =>
    runJournalRecording(
        context,
        buildRefundLineItems,
        "refund",
        "Refund journal entry"
    );

// Records a cashback credit — money given to the corporate's wallet (persists
// under "cashback").
const recordCashbackCredit = (context) =>
    runJournalRecording(
        context,
        buildCashbackLineItems,
        "cashback",
        "Cashback journal entry"
    );

// Records a cashback reversal — a previously given cashback taken back
// (persists under "cashbackReversal").
const recordCashbackReversal = (context) =>
    runJournalRecording(
        context,
        buildCashbackReversalLineItems,
        "cashbackReversal",
        "Cashback reversal journal entry"
    );

// Records an admin-initiated refund — reverses the ORIGINAL transaction's stored
// account IDs + amounts (persists under "adminRefund").
const recordAdminRefund = (context) =>
    runJournalRecording(
        context,
        buildAdminRefundLineItems,
        "adminRefund",
        "Admin refund journal entry"
    );

const recordDirectLineItems = async (context, key, notesLabel) => {
    const { corporateTxnId, lineItems, occurredAt } = context || {};

    if (
        !corporateTxnId ||
        !Array.isArray(lineItems) ||
        lineItems.length === 0
    ) {
        return {
            success: false,
            error: "corporateTxnId and lineItems are required",
        };
    }

    const gotLock = await acquireJournalLock(corporateTxnId, key);
    if (!gotLock) {
        return {
            success: false,
            locked: true,
            reason: "Another attempt to record this journal is already in progress",
        };
    }

    try {
        const existingOrder = await findByCorporateTxnId(corporateTxnId, ["journalRecordStatus"]);
        if (existingOrder?.journalRecordStatus?.[key] === true) {
            return {
                success: false,
                alreadyRecorded: true,
                reason: "This journal is already in the books; use Edit to change it",
            };
        }

        const workingLineItems = lineItems.map((item) => ({ ...item }));
        const { balanced, reason: balanceReason } = await applyRoundingAdjustment(
            workingLineItems,
            corporateTxnId
        );
        if (!balanced) {
            const reason = balanceReason || "Line items are not balanced";
            return skipJournal(corporateTxnId, key, reason, { lineItems: workingLineItems });
        }

        if (!(await isJournalRecordingEnabled())) {
            return skipJournal(corporateTxnId, key, "Journal recording is currently paused", {
                lineItems: workingLineItems,
            });
        }

        const journalDate = istDay(occurredAt || new Date());
        const payload = {
            journalDate,
            referenceNumber: corporateTxnId,
            notes: `${notesLabel} (admin retry) for corporate transaction ${corporateTxnId}`,
            lineItems: workingLineItems,
        };

        try {
            logJournalPayload(corporateTxnId, workingLineItems, journalDate);

            const provider = getAccountingProvider();
            const result = await provider.journal.recordJournal(payload);

            const failureReason = result.success
                ? undefined
                : result.error || "Provider rejected the journal entry";

            let derived = null;
            if (result.success && key === "transaction") {
                // The lines are what went to the books, so the figures the ledgers read follow them.
                try {
                    derived = splitFromLines(
                        workingLineItems,
                        await accountNamesById(workingLineItems),
                        (await getGstRatePct()) / 100
                    );
                } catch (deriveError) {
                    customLog(null, "error", {
                        message: "Could not derive the figures from the corrected lines",
                        corporateTxnId,
                        reason: deriveError?.message,
                    });
                }
            }

            await persistJournalRecord(corporateTxnId, key, {
                payload: {
                    ...payload,
                    provider: provider.name,
                    ...(result.success ? { providerJournalId: result.providerJournalId } : {}),
                },
                recorded: !!result.success,
                journalAccountIds: derived?.journalAccountIds || undefined,
                reason: failureReason,
                flatFields: derived
                    ? { ...derived.split, ...(derived.commissionMode ? { commissionMode: derived.commissionMode } : {}) }
                    : undefined,
            });

            if (result.success) {
                customLog(null, "info", {
                    message: "Journal re-posted via admin direct retry",
                    corporateTxnId,
                    key,
                    provider: provider.name,
                    providerJournalId: result.providerJournalId,
                });
                return {
                    success: true,
                    providerJournalId: result.providerJournalId,
                };
            }
            return {
                success: false,
                providerJournalId: null,
                error: failureReason,
                reason: failureReason,
            };
        } catch (error) {
            const failureReason =
                error?.response?.data?.message ||
                error?.message ||
                "Unexpected error during admin direct journal retry";
            customLog(null, "error", {
                message: "An error occurred during admin direct journal retry",
                corporateTxnId,
                key,
                reason: failureReason,
            });
            await persistJournalRecord(corporateTxnId, key, {
                payload,
                recorded: false,
                reason: failureReason,
            });
            return { success: false, error: failureReason, reason: failureReason };
        }
    } finally {
        await releaseJournalLock(corporateTxnId, key);
    }
};

// Records an admin wallet transfer journal — Subscribers Wallet <-> Cashback Expense
// (persists under "walletTransfer" on the transaction row).
const recordWalletTransfer = (context) =>
    runJournalRecording(
        { ...context, journalTarget: "walletTransfer" },
        buildWalletTransferLineItems,
        "walletTransfer",
        "Wallet transfer journal entry"
    );

module.exports = {
    recordJournal,
    recordRefund,
    recordCashbackCredit,
    recordCashbackReversal,
    recordAdminRefund,
    recordWalletTransfer,
    recordDirectLineItems,
};
