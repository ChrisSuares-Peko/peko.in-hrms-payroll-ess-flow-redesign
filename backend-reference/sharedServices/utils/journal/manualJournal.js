const { customLog } = require("../loggerHelper");
const { getAccountingProvider } = require("../providers");
const {
    buildTransactionLineItems,
    buildRefundLineItems,
    buildCashbackLineItems,
    buildCashbackReversalLineItems,
    buildAdminRefundLineItems,
    applyRoundingAdjustment,
    ACCOUNTS,
} = require("./lineItemBuilder");
const { persistJournalRecord, findByCorporateTxnId } = require("../../models/use-cases/order");
const { findAllByProviderAccountIds } = require("../../models/use-cases/chartOfAccount");
const { isJournalRecordingEnabled, getGstRatePct } = require("../../models/use-cases/setting");
const { acquireJournalLock, releaseJournalLock } = require("./journalLock");

const JOURNAL_LABELS = {
    transaction: "Journal entry",
    refund: "Refund journal entry",
    adminRefund: "Admin refund journal entry",
    cashback: "Cashback journal entry",
    cashbackReversal: "Cashback reversal journal entry",
};

const BUILDERS = {
    transaction: buildTransactionLineItems,
    refund: buildRefundLineItems,
    adminRefund: buildAdminRefundLineItems,
    cashback: buildCashbackLineItems,
    cashbackReversal: buildCashbackReversalLineItems,
};

const MANUAL_KEYS = Object.keys(JOURNAL_LABELS);

const CARRIED_EXTRAS = ["refundAmount", "totalOrderAmount", "amount"];

const DIRECTIONS = new Set(["debit", "credit"]);

const ALREADY_RECORDED_REASON = "This journal is already in the books";
const PAUSED_REASON = "Journal recording is currently paused";
const LOCKED_REASON = "Another attempt to record this journal is already in progress";

const fail = (reason, extra = {}) => ({ success: false, reason, ...extra });

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const OUTPUT_GST = [ACCOUNTS.outputCGST, ACCOUNTS.outputSGST, ACCOUNTS.outputIGST];
const INPUT_GST = [ACCOUNTS.inputCGST, ACCOUNTS.inputSGST, ACCOUNTS.inputIGST];
const KNOWN_ACCOUNTS = new Set(Object.values(ACCOUNTS));

const accountNamesById = async (lineItems) => {
    const ids = [...new Set(lineItems.map((item) => String(item.accountId)))];
    const rows = await findAllByProviderAccountIds(ids, ["provider_account_id", "account_name"]);
    return new Map((rows || []).map((row) => [String(row.provider_account_id), row.account_name || null]));
};

const PRINCIPAL_MARKUP = "PRINCIPAL_MARKUP";
const MARGIN = "MARGIN";
const MIXED = "MIXED";
const OWN_REVENUE = "OWN_REVENUE";

// A Sales credit alone is a principal markup; a commission or a vendor deposit alone is a
// margin sale; both together is a mixed order. A revenue credit with none of those is a sale
// on Peko's own account, booked the way a subscription is. Lines with none say nothing.
const modeOfLines = ({ sales, commission, vendorPayable, revenue }) => {
    const margin = commission > 0 || vendorPayable > 0;
    if (sales > 0 && margin) return MIXED;
    if (sales > 0) return PRINCIPAL_MARKUP;
    if (margin) return MARGIN;
    if (revenue > 0) return OWN_REVENUE;
    return null;
};

const splitFromLines = (lineItems, namesById, gstRate = 0.18) => {
    const named = lineItems.map((item) => ({ ...item, name: namesById.get(String(item.accountId)) || null }));
    const total = (direction, names) =>
        round2(
            named
                .filter((item) => item.direction === direction && names.includes(item.name))
                .reduce((sum, item) => sum + Number(item.amount), 0)
        );
    const net = (name) => round2(total("credit", [name]) - total("debit", [name]));
    const gatewayLines = named.filter((item) => item.direction === "debit" && !KNOWN_ACCOUNTS.has(item.name));
    const gateway = round2(gatewayLines.reduce((sum, item) => sum + Number(item.amount), 0));
    const wallet = total("debit", [ACCOUNTS.subscribersWallet]);
    const commission = net(ACCOUNTS.commission);
    const vendorPayable = net(ACCOUNTS.vendorDeposits);
    const sales = round2(net(ACCOUNTS.sales) + net(ACCOUNTS.vendorPayableTemporary));
    const platformFee = net(ACCOUNTS.platformFees);
    const revenue = round2(net(ACCOUNTS.subscriptionFees) + net(ACCOUNTS.deferredRevenue));
    const outputGst = total("credit", OUTPUT_GST);
    const commissionMode = modeOfLines({ sales, commission, vendorPayable, revenue });

    const split = {
        totalTransactionAmount: round2(gateway + wallet),
        paymentThroughGateway: gateway,
        paymentThroughWallet: wallet,
    };
    if (commissionMode === OWN_REVENUE) {
        // The output GST is GST on Peko's own revenue, apart from a platform fee's own share.
        // There is no commission and no vendor payable to read, and no platform fee unless a
        // line carries one.
        const platformFeeGst = Math.min(outputGst, round2(platformFee * gstRate));
        Object.assign(split, {
            netSubscriptionIncome: revenue,
            outputGSTonRevenue: round2(outputGst - platformFeeGst),
        });
        if (platformFee > 0) {
            Object.assign(split, {
                platformFeeExcludingGST: platformFee,
                outputGSTonPlatformFee: platformFeeGst,
                platformFeeIncludingGST: round2(platformFee + platformFeeGst),
            });
        }
    } else if (commissionMode === PRINCIPAL_MARKUP || commissionMode === MIXED) {
        // Peko's own commission on the principal items sits inside the Sales credit; only its
        // GST stands apart from the platform fee's and the margin commission's, so it is read
        // back off what is left of the output GST at the rate.
        const platformFeeGst = Math.min(outputGst, round2(platformFee * gstRate));
        const commissionGst = Math.min(round2(outputGst - platformFeeGst), round2(commission * gstRate));
        const principalGst = round2(outputGst - platformFeeGst - commissionGst);
        const principalCommission = gstRate > 0 ? Math.min(sales, round2(principalGst / gstRate)) : 0;
        Object.assign(split, {
            commissionExcludingGST: commission,
            outputGSTonCommission: commissionGst,
            commissionIncludingGST: round2(commission + commissionGst),
            vendorPayable,
            principalSalesPayable: round2(sales - principalCommission),
            principalCommissionExcludingGST: principalCommission,
            outputGSTonPrincipalCommission: principalGst,
            platformFeeExcludingGST: platformFee,
            outputGSTonPlatformFee: platformFeeGst,
            platformFeeIncludingGST: round2(platformFee + platformFeeGst),
        });
    } else if (commissionMode === MARGIN) {
        const base = round2(commission + platformFee);
        const platformFeeGst = base > 0 ? round2((outputGst * platformFee) / base) : 0;
        const commissionGst = round2(outputGst - platformFeeGst);
        Object.assign(split, {
            commissionExcludingGST: commission,
            outputGSTonCommission: commissionGst,
            commissionIncludingGST: round2(commission + commissionGst),
            vendorPayable,
            platformFeeExcludingGST: platformFee,
            outputGSTonPlatformFee: platformFeeGst,
            platformFeeIncludingGST: round2(platformFee + platformFeeGst),
        });
    } else if (platformFee > 0) {
        // Lines that name no sale type still vouch for the money in and a platform fee; nothing
        // else is read into figures the profiles would take as fact.
        const platformFeeGst = Math.min(outputGst, round2(platformFee * gstRate));
        Object.assign(split, {
            platformFeeExcludingGST: platformFee,
            outputGSTonPlatformFee: platformFeeGst,
            platformFeeIncludingGST: round2(platformFee + platformFeeGst),
        });
    }
    const partnerFee = total("debit", [ACCOUNTS.partnershipFees]);
    const partnerPayable = total("credit", [ACCOUNTS.partnershipFeePayable]);
    if (partnerFee > 0 || partnerPayable > 0) {
        split.partnerShipFee = partnerFee;
        split.inputGSTonPartnerShipFee = total("debit", INPUT_GST);
        split.partnerPayable = partnerPayable;
    }
    const coupon = total("debit", [ACCOUNTS.couponDiscountExpense]);
    if (coupon > 0) split.couponTotalDiscount = coupon;
    const gatewayLine = gatewayLines[0];
    if (gatewayLine && gatewayLine.name) split.paymentGatewayName = gatewayLine.name;

    return {
        split,
        commissionMode,
        journalAccountIds: gatewayLine ? { paymentGateway: String(gatewayLine.accountId) } : null,
    };
};

const pick = (source, keys) =>
    keys.reduce((picked, key) => {
        if (source && source[key] !== undefined && source[key] !== null) picked[key] = source[key];
        return picked;
    }, {});

const normaliseLineItems = (lineItems, corporateTxnId) =>
    lineItems.map((item) => ({
        accountId: item.accountId === undefined || item.accountId === null ? "" : String(item.accountId),
        direction: item.direction,
        amount: Number(item.amount),
        description: item.description || corporateTxnId,
    }));

const unknownAccountIds = async (lineItems) => {
    const ids = [...new Set(lineItems.map((item) => item.accountId))];
    const rows = await findAllByProviderAccountIds(ids, ["provider_account_id", "syncStatus"]);
    const synced = new Set(
        rows
            .filter((row) => /_SUCCESS$/.test(row.syncStatus || "CREATE_SUCCESS"))
            .map((row) => String(row.provider_account_id))
    );
    return ids.filter((id) => !synced.has(id));
};

const buildJournalPreview = async (context, key) => {
    const build = BUILDERS[key];
    if (!build) return { ok: false, reason: `Unknown journal key '${key}'` };

    const {
        reportData,
        corporateTxnId,
        vendor,
        paymentGatewayName,
        credentialId,
        registeredBy = null,
        amount,
        refundAmount,
        totalOrderAmount,
        direction,
    } = context || {};

    try {
        const built = await build({
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
        if (!built.ok) return { ok: false, reason: built.reason };

        const lineItems = built.lineItems.map((item) => ({ ...item }));
        const balance = await applyRoundingAdjustment(lineItems, corporateTxnId);
        return {
            ok: true,
            lineItems,
            journalAccountIds: built.journalAccountIds || null,
            balanced: balance.balanced,
            reason: balance.balanced ? null : balance.reason,
        };
    } catch (error) {
        return { ok: false, reason: error?.message || "Unexpected error while building the journal" };
    }
};

const recordManualJournal = async (context, key) => {
    const {
        corporateTxnId,
        lineItems,
        journalDate,
        journalData: flatFields,
        journalAccountIds,
        actor,
        reason,
    } = context || {};

    if (!MANUAL_KEYS.includes(key)) return fail(`Unknown journal key '${key}'`);
    if (!corporateTxnId || !journalDate || !Array.isArray(lineItems) || lineItems.length < 2) {
        return fail("corporateTxnId, journalDate and at least two line items are required");
    }

    const gotLock = await acquireJournalLock(corporateTxnId, key);
    if (!gotLock) return { success: false, locked: true, reason: LOCKED_REASON };

    try {
        const existing = await findByCorporateTxnId(corporateTxnId, ["journalData", "journalRecordStatus"]);
        if (!existing) return fail("Order not found");

        const posted = existing.journalRecordStatus?.[key] === true;
        if (posted) return fail(ALREADY_RECORDED_REASON, { alreadyRecorded: true });
        if (!(await isJournalRecordingEnabled())) return fail(PAUSED_REASON, { paused: true });

        const workingLineItems = normaliseLineItems(lineItems, corporateTxnId);
        const invalid = workingLineItems.find(
            (item) => !item.accountId || !DIRECTIONS.has(item.direction) || !(item.amount > 0)
        );
        if (invalid) return fail("Every line needs an account, a debit or credit side and an amount above zero");

        const unknown = await unknownAccountIds(workingLineItems);
        if (unknown.length) {
            return fail(`These accounts are not in the chart of accounts or not synced yet: ${unknown.join(", ")}`);
        }

        const balance = await applyRoundingAdjustment(workingLineItems, corporateTxnId);
        if (!balance.balanced) return fail(balance.reason || "Line items are not balanced");

        const derived =
            key === "transaction"
                ? splitFromLines(workingLineItems, await accountNamesById(workingLineItems), (await getGstRatePct()) / 100)
                : { split: {}, commissionMode: null, journalAccountIds: null };
        const existingRoot = existing.journalData || {};
        const fromLines = Object.fromEntries(
            Object.entries(derived.split).filter(
                ([field]) => existingRoot[field] === undefined || existingRoot[field] === null
            )
        );
        const figures = { ...fromLines, ...(flatFields || {}) };
        // A mode the accounts team stated in the set-up wins; otherwise the lines are what went
        // to the books, so they name the mode, and where they say nothing, nothing is stored.
        const statedMode = flatFields && flatFields.commissionMode;
        if (statedMode || derived.commissionMode) figures.commissionMode = statedMode || derived.commissionMode;

        const label = JOURNAL_LABELS[key];
        const stored = existing.journalData?.[key] || {};
        const payloadBase = {
            journalDate,
            referenceNumber: corporateTxnId,
            notes: `${label} for corporate transaction ${corporateTxnId} — recorded manually by ${actor?.name || "admin"}`,
            lineItems: workingLineItems,
            ...pick(stored, CARRIED_EXTRAS),
        };

        const provider = getAccountingProvider();
        const action = "recorded";
        const result = await provider.journal.recordJournal(payloadBase);
        const failureReason = result.success ? null : result.error || result.reason || "Provider rejected the journal entry";

        await persistJournalRecord(corporateTxnId, key, {
            payload: {
                ...payloadBase,
                provider: provider.name,
                ...(result.success ? { providerJournalId: result.providerJournalId } : {}),
                manual: {
                    action,
                    byId: actor?.id ?? null,
                    byName: actor?.name || null,
                    at: new Date().toISOString(),
                    reason: reason || null,
                },
            },
            recorded: !!result.success,
            journalAccountIds: journalAccountIds || derived.journalAccountIds || undefined,
            reason: failureReason || undefined,
            flatFields: result.success && Object.keys(figures).length ? figures : undefined,
        });

        customLog(null, "info", {
            message: "[manualJournal] finished",
            corporateTxnId,
            key,
            action,
            success: !!result.success,
            providerJournalId: result.success ? result.providerJournalId : null,
            by: actor?.name || null,
        });

        return {
            success: !!result.success,
            action,
            providerJournalId: result.success ? result.providerJournalId : null,
            reason: failureReason,
        };
    } catch (error) {
        const failureReason = error?.response?.data?.message || error?.message || "Unexpected error while recording the journal";
        customLog(null, "error", {
            message: "[manualJournal] error",
            corporateTxnId,
            key,
            reason: failureReason,
        });
        return fail(failureReason);
    } finally {
        await releaseJournalLock(corporateTxnId, key);
    }
};

module.exports = {
    JOURNAL_LABELS,
    MANUAL_KEYS,
    ALREADY_RECORDED_REASON,
    PAUSED_REASON,
    buildJournalPreview,
    splitFromLines,
    accountNamesById,
    recordManualJournal,
    unknownAccountIds,
};
