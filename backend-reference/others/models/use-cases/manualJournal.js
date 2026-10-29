const { Op } = require("sequelize");
const orders = require("../entities/order");
const serviceOperator = require("../entities/serviceOperator");
const credential = require("../entities/credential");
const corporateUser = require("../entities/corporateUser");
const transactions = require("../entities/transaction");
const chartOfAccounts = require("../entities/chartOfAccount");
const journalAdjustments = require("../entities/journalAdjustment");
const { findOneCredential } = require("./credential");
const { getASetting } = require("./setting");
const { loadAccountingFloor, isBeforeGoLive, dayOf } = require("./accountingPeriod");
const { eventPostingOfJournal } = require("./journalPosting");
const { withAccountNames } = require("./journalAccountNames");
const { GAP_KEYS } = require("./journalConfigurationGate");
const { WALLET_JOURNAL_KEYS, settleConfigurationGaps } = require("./journalContext");
const { setupDefaultsFor, loadGstRatePct } = require("./manualJournalSetup");

const MANUAL_KEYS = ["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"];

const EVENT_LABELS = {
    transaction: "Sale",
    refund: "Refund",
    adminRefund: "Admin refund",
    cashback: "Cashback",
    cashbackReversal: "Cashback reversal",
};

const ACTIONS = { recorded: "RECORDED" };

const SALE_STATUSES = ["SUCCESS", "ORDERED", "REFUNDED", "REFUND"];
const REFUND_STATUSES = ["REFUNDED", "REFUND"];
const FAILED_STATUSES = ["FAILED", "FAILURE"];

const ROOT_EXCLUDED = new Set([...MANUAL_KEYS, ...GAP_KEYS, "walletTransfer", "journalAccountIds"]);

const PAUSED_REASON = "Journal recording is currently paused";
const BEFORE_GO_LIVE_REASON = "This order is dated before the accounting go-live date";
const ALREADY_IN_BOOKS_REASON = "Already in the books";
const NOT_IN_BOOKS_REASON = "Not in the books yet; record it first";

const parseJson = value => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const statusOf = order =>
    String(order?.status || "")
        .trim()
        .toUpperCase();

const toNumber = value => Number(value) || 0;

const splitOf = journalData =>
    Object.fromEntries(Object.entries(journalData || {}).filter(([key]) => !ROOT_EXCLUDED.has(key)));

const traceOf = (journalData, key) => {
    const entry = journalData ? journalData[key] : null;
    return entry && typeof entry === "object" ? entry : null;
};

const hasTrace = entry =>
    Boolean(
        entry &&
            ((Array.isArray(entry.lineItems) && entry.lineItems.length) ||
                entry.skipped ||
                entry.reason ||
                entry.journalDate)
    );

const findOrder = corporateTxnId =>
    orders.findOne({
        where: { corporateTxnId },
        include: [
            {
                model: serviceOperator,
                attributes: [
                    "id",
                    "serviceProvider",
                    "vendorId",
                    "commissionMode",
                    "commissionType",
                    "providerCommission",
                    "fixedCommissionPerTransaction",
                    "isCommissionInclGST",
                ],
                required: false,
            },
            { model: credential, attributes: ["id", "name", "username", "registeredBy"], required: false },
        ],
        raw: true,
        nest: true,
    });

const walletRowsOf = corporateTxnId =>
    transactions.findAll({
        where: { corporateTxnId },
        attributes: ["id", "transactionDate", "creditAmount", "debitAmount"],
        order: [["transactionDate", "ASC"], ["id", "ASC"]],
        raw: true,
    });

const isRecordingPaused = async () => {
    const details = await getASetting("journalRecording");
    return Boolean(details) && details.enabled === false;
};

const partnerNameOf = async registeredBy => {
    if (!/^\d+$/.test(String(registeredBy || ""))) return null;
    const partner = await findOneCredential({ id: Number(registeredBy) }, ["id", "name"]);
    return partner?.name || null;
};

const partnerIdOf = registeredBy => (/^\d+$/.test(String(registeredBy || "")) ? Number(registeredBy) : null);

const profileOf = async credentialId =>
    credentialId ? corporateUser.findOne({ where: { credentialId }, attributes: ["gstNumber", "state"], raw: true }) : null;

const gatewayNameOf = (journalData, paymentModeResponse) => {
    if (journalData && journalData.paymentGatewayName) return journalData.paymentGatewayName;
    const parsed = parseJson(paymentModeResponse);
    const response = Array.isArray(parsed) ? parsed[0] : parsed;
    return (response && response.paymentGatewayName) || null;
};

const serviceNameOf = order => {
    if (order.serviceOperator?.id) return order.serviceOperator.serviceProvider || null;
    const response = parseJson(order.orderResponse);
    return response?.serviceName || response?.subscriptionDetails?.name || null;
};

const defaultsOf = ({ order, key, stored, walletRows }) => {
    const orderDay = dayOf(order.transactionDate);
    const credits = walletRows.filter(row => toNumber(row.creditAmount) > 0);
    const clawbacks = walletRows.filter(row => toNumber(row.creditAmount) < 0);
    const refunds = walletRows.filter(row => toNumber(row.debitAmount) < 0);
    const storedDay = stored?.journalDate ? dayOf(stored.journalDate) : null;

    if (key === "cashback") {
        const row = credits[credits.length - 1];
        return {
            journalDate: storedDay || (row ? dayOf(row.transactionDate) : orderDay),
            amount: row ? toNumber(row.creditAmount) : toNumber(stored?.amount) || null,
        };
    }
    if (key === "cashbackReversal") {
        const row = clawbacks[clawbacks.length - 1];
        return {
            journalDate: storedDay || (row ? dayOf(row.transactionDate) : orderDay),
            amount: row ? -toNumber(row.creditAmount) : toNumber(stored?.amount) || null,
        };
    }
    if (key === "adminRefund") {
        return {
            journalDate: storedDay || orderDay,
            refundAmount: stored?.refundAmount ?? null,
            totalOrderAmount: stored?.totalOrderAmount ?? null,
        };
    }
    if (key === "refund") {
        const row = refunds[refunds.length - 1];
        return { journalDate: storedDay || (row ? dayOf(row.transactionDate) : orderDay) };
    }
    return { journalDate: storedDay || orderDay };
};

const recordReasons = ({ order, key, verdicts, journalData, walletRows }) => {
    const status = statusOf(order);
    const stored = traceOf(journalData, key);

    if (key === "transaction") {
        if (status === "PENDING") return ["This order is still pending; nothing final to record"];
        if (SALE_STATUSES.includes(status)) return [];
        const refundPosted = verdicts.refund === true || verdicts.adminRefund === true;
        if (FAILED_STATUSES.includes(status) && refundPosted) return [];
        return ["This order did not go through; a sale can be recorded only once a refund is in the books"];
    }
    if (key === "refund") {
        return REFUND_STATUSES.includes(status) || hasTrace(stored)
            ? []
            : ["The records show no refund on this order"];
    }
    if (key === "adminRefund") {
        return stored && stored.refundAmount && stored.totalOrderAmount
            ? []
            : ["The records show no admin refund on this order"];
    }
    if (key === "cashback") {
        return walletRows.some(row => toNumber(row.creditAmount) > 0) || toNumber(stored?.amount) > 0
            ? []
            : ["The records show no cashback credited for this order"];
    }
    return walletRows.some(row => toNumber(row.creditAmount) < 0) || toNumber(stored?.amount) > 0
        ? []
        : ["The records show no cashback taken back on this order"];
};

const eligibilityOf = ({ order, key, verdicts, journalData, walletRows, beforeGoLive, held }) => {
    if (beforeGoLive) return { canRecord: false, reasons: [BEFORE_GO_LIVE_REASON] };
    if (held && !WALLET_JOURNAL_KEYS.has(key)) return { canRecord: false, reasons: [held] };
    if (verdicts[key] === true) return { canRecord: false, reasons: [ALREADY_IN_BOOKS_REASON] };

    const reasons = recordReasons({ order, key, verdicts, journalData, walletRows });
    return { canRecord: reasons.length === 0, reasons: reasons.length ? reasons : [NOT_IN_BOOKS_REASON] };
};

const warningsOf = ({ key, verdicts, recordingPaused }) => {
    const warnings = [];
    if (recordingPaused) warnings.push(PAUSED_REASON);
    if (key === "transaction" && (verdicts.refund === true || verdicts.adminRefund === true)) {
        warnings.push(
            "A refund entry for this order is already in the books and was worked out from the current split; edit it separately if the split changes"
        );
    }
    if (key === "adminRefund" && verdicts.transaction !== true) {
        warnings.push("The sale entry is not in the books yet");
    }
    return warnings;
};

const serializeStoredJournal = async (stored, corporateTxnId) => {
    if (!stored) return null;
    return {
        journalDate: stored.journalDate ? dayOf(stored.journalDate) : null,
        notes: stored.notes || null,
        lineItems: await withAccountNames(stored.lineItems || [], corporateTxnId),
        providerJournalId: stored.providerJournalId ? String(stored.providerJournalId) : null,
        manual: stored.manual || null,
        reason: stored.reason || null,
        skipped: stored.skipped === true,
    };
};

const serializeAdjustment = row => {
    const plain = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    return {
        id: plain.id,
        corporateTxnId: plain.corporateTxnId,
        journalKey: plain.journalKey,
        event: EVENT_LABELS[plain.journalKey] || plain.journalKey,
        action: plain.action,
        journalDate: plain.journalDate,
        reason: plain.reason,
        splitBefore: plain.splitBefore || null,
        splitAfter: plain.splitAfter || null,
        lineItemsBefore: plain.lineItemsBefore || null,
        lineItemsAfter: plain.lineItemsAfter || null,
        providerJournalId: plain.providerJournalId || null,
        result: plain.result,
        failureReason: plain.failureReason || null,
        recordedByName: plain.recordedByName || null,
        createdAt: plain.createdAt,
    };
};

const listHistory = async corporateTxnId => {
    const rows = await journalAdjustments.findAll({
        where: { corporateTxnId },
        order: [["createdAt", "DESC"], ["id", "DESC"]],
        raw: true,
    });
    return rows.map(serializeAdjustment);
};

const buildLookup = async corporateTxnId => {
    const order = await findOrder(corporateTxnId);
    if (!order) return null;

    const [walletRows, accountingFloor, recordingPaused, history, profile, gstRatePct] = await Promise.all([
        walletRowsOf(corporateTxnId),
        loadAccountingFloor(),
        isRecordingPaused(),
        listHistory(corporateTxnId),
        profileOf(order.credential && order.credential.id),
        loadGstRatePct(),
    ]);

    const stored = parseJson(order.journalData) || {};
    const { held, journalData } = await settleConfigurationGaps({ ...order, journalData: stored }, stored);
    const verdicts = parseJson(order.journalRecordStatus) || {};
    const beforeGoLive = isBeforeGoLive(order.transactionDate, accountingFloor);

    const events = [];
    for (const key of MANUAL_KEYS) {
        const stored = traceOf(journalData, key);
        events.push({
            key,
            label: EVENT_LABELS[key],
            verdict: verdicts[key] === true ? true : verdicts[key] === false ? false : null,
            posting: eventPostingOfJournal(order, key, { expected: key === "transaction" && SALE_STATUSES.includes(statusOf(order)) }),
            journal: await serializeStoredJournal(stored, corporateTxnId),
            defaults: defaultsOf({ order, key, stored, walletRows }),
            eligibility: eligibilityOf({ order, key, verdicts, journalData, walletRows, beforeGoLive, held }),
            warnings: warningsOf({ key, verdicts, recordingPaused }),
        });
    }

    // The set-up step is only for an order whose breakdown was never worked out; one that
    // carries figures goes straight to them.
    const split = splitOf(journalData);
    const hasFigures = Object.values(split).some(value => typeof value === "number");
    const partnerId = partnerIdOf(order.credential?.registeredBy);
    const setup = hasFigures
        ? null
        : await setupDefaultsFor({ order, accounts: await listPostableAccounts(), partnerId, gstRatePct });

    return {
        order: {
            id: order.id,
            corporateTxnId: order.corporateTxnId,
            transactionDate: order.transactionDate,
            status: order.status || null,
            service: serviceNameOf(order),
            customer: order.credential?.id
                ? {
                      username: order.credential.username || null,
                      name: order.credential.name || null,
                      gstNumber: (profile && profile.gstNumber) || null,
                      state: (profile && profile.state) || null,
                  }
                : null,
            partnerId,
            partnerName: await partnerNameOf(order.credential?.registeredBy),
            paymentGateway: gatewayNameOf(journalData, order.paymentModeResponse),
            amountInINR: order.amountInINR === null || order.amountInINR === undefined ? null : Number(order.amountInINR),
            paymentMode: order.paymentMode || null,
        },
        split,
        setup,
        recordingPaused,
        beforeGoLive,
        accountingFloor,
        events,
        history,
    };
};

const listPostableAccounts = async () => {
    const rows = await chartOfAccounts.findAll({
        where: {
            provider_account_id: { [Op.ne]: null },
            syncStatus: { [Op.like]: "%\\_SUCCESS" },
        },
        attributes: ["provider_account_id", "account_name", "account_type", "vendorId", "partnerId", "corporateUserId"],
        order: [["account_name", "ASC"]],
        raw: true,
    });
    return (rows || []).map(row => ({
        id: String(row.provider_account_id),
        name: row.account_name,
        type: row.account_type || null,
        shared: row.vendorId == null && row.partnerId == null && row.corporateUserId == null,
    }));
};

const journalDateProblem = (journalDate, accountingFloor) => {
    const day = dayOf(journalDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "The journal date must be a date";
    if (day > dayOf(new Date())) return "The journal date cannot be in the future";
    if (day <= accountingFloor) return "The journal date cannot be before the accounting go-live date";
    return null;
};

const recordAdjustment = async ({ corporateTxnId, journalKey, result, before, after, journalDate, reason, actor }) =>
    journalAdjustments.create({
        corporateTxnId,
        journalKey,
        action: ACTIONS.recorded,
        journalDate: dayOf(journalDate),
        reason,
        splitBefore: before.split || null,
        splitAfter: after.split || null,
        lineItemsBefore: before.lineItems || null,
        lineItemsAfter: after.lineItems || null,
        providerJournalId: result.providerJournalId || null,
        result: result.success ? "POSTED" : "FAILED",
        failureReason: result.success ? null : result.reason || null,
        recordedById: actor && actor.id,
        recordedByName: actor && actor.name,
    });

module.exports = {
    MANUAL_KEYS,
    EVENT_LABELS,
    ACTIONS,
    PAUSED_REASON,
    splitOf,
    defaultsOf,
    eligibilityOf,
    warningsOf,
    journalDateProblem,
    buildLookup,
    listPostableAccounts,
    listHistory,
    recordAdjustment,
    serializeAdjustment,
};
