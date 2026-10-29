const orders = require("../entities/order");
const serviceOperator = require("../entities/serviceOperator");
const vendor = require("../entities/vendor");
const credential = require("../entities/credential");
const { GAP_KEYS, refreshConfigurationGaps } = require("./journalConfigurationGate");

const WALLET_JOURNAL_KEYS = new Set(["cashback", "cashbackReversal"]);

const snapshotOf = async (order, journalKey, reportData) => {
    let vendorSnapshot = null;
    const isSubscription = reportData?.journalData?.netSubscriptionIncome != null;
    if (!WALLET_JOURNAL_KEYS.has(journalKey) && !isSubscription && order.serviceOperatorId) {
        const so = await serviceOperator.findOne({
            where: { id: order.serviceOperatorId },
            raw: true,
        });
        if (so?.vendorId) {
            const v = await vendor.findOne({
                where: { id: so.vendorId },
                attributes: ["vendorName"],
                raw: true,
            });
            vendorSnapshot = v ? { vendorName: v.vendorName } : null;
        }
    }

    let registeredBy = null;
    if (order.credentialId) {
        const cred = await credential.findOne({
            where: { id: order.credentialId },
            attributes: ["registeredBy"],
            raw: true,
        });
        registeredBy = cred?.registeredBy || null;
    }

    return { vendor: vendorSnapshot, credentialId: order.credentialId, registeredBy };
};

const withoutKeys = (journalData, keys) => {
    const next = { ...(journalData || {}) };
    keys.forEach(key => delete next[key]);
    return next;
};

const settleConfigurationGaps = async (order, journalData) => {
    const gate = await refreshConfigurationGaps(order, journalData);
    if (gate.refusal) return { held: gate.refusal, journalData: gate.journalData };

    const stored = order.journalData || {};
    const cleared = GAP_KEYS.filter(key => stored[key] !== undefined && gate.journalData[key] === undefined);
    if (cleared.length) {
        await orders.update(
            { journalData: withoutKeys(stored, cleared) },
            { where: { corporateTxnId: order.corporateTxnId } }
        );
    }
    return { held: null, journalData: gate.journalData };
};

// Everything the worker needs to build a journal for this order and key, exactly as the
// admin retry assembles it. The operator's own journalling toggle is forced on: a person
// asking for the entry is a deliberate decision.
const journalContextFor = async (
    order,
    journalKey,
    { editedJournalData, amount, refundAmount, totalOrderAmount } = {}
) => {
    if (WALLET_JOURNAL_KEYS.has(journalKey)) {
        const resolvedAmount = Number(amount ?? order.journalData?.[journalKey]?.amount);
        if (!resolvedAmount || resolvedAmount <= 0) {
            return { ok: false, reason: "A positive amount is required to retry a wallet journal" };
        }
        return {
            ok: true,
            reportData: undefined,
            amounts: { amount: resolvedAmount },
            contextSnapshot: await snapshotOf(order, journalKey, null),
            editedJournalData: null,
        };
    }

    const settled = await settleConfigurationGaps(order, {
        ...(order.journalData || {}),
        ...(editedJournalData || {}),
    });
    if (settled.held) return { ok: false, held: true, reason: settled.held };

    const mergedJournalData = settled.journalData;
    const reportData = { journalData: { ...mergedJournalData, recordJournalEntry: true } };

    let amounts = {};
    if (journalKey === "adminRefund") {
        const resolvedRefundAmount = refundAmount ?? order.journalData?.adminRefund?.refundAmount;
        const resolvedTotalOrderAmount =
            totalOrderAmount ?? order.journalData?.adminRefund?.totalOrderAmount;
        if (!resolvedRefundAmount || !resolvedTotalOrderAmount) {
            return {
                ok: false,
                reason: "refundAmount and totalOrderAmount are required to retry an admin refund",
            };
        }
        amounts = { refundAmount: resolvedRefundAmount, totalOrderAmount: resolvedTotalOrderAmount };
    }

    return {
        ok: true,
        reportData,
        amounts,
        contextSnapshot: await snapshotOf(order, journalKey, reportData),
        editedJournalData:
            editedJournalData && Object.keys(editedJournalData).length ? editedJournalData : null,
    };
};

module.exports = { WALLET_JOURNAL_KEYS, settleConfigurationGaps, journalContextFor };
