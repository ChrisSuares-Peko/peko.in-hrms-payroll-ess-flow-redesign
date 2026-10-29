const { DEBIT, CREDIT, toNumber, entryRow } = require("./ledgerStatement");
const { FUNDING_CATEGORIES, SERVICE_SELECT } = require("./subscriberLedger");
const { flooredAfter } = require("./accountingPeriod");
const {
    SALE_KEY,
    ORDER_POSTING_KEYS,
    postingSelect,
    eventPosting,
    factsOfRow,
    refundKeyOfRow,
} = require("./journalPosting");

const FUNDING_SET = new Set(Object.values(FUNDING_CATEGORIES));

const WALLET_POSTING_KEYS = [...ORDER_POSTING_KEYS, "cashback", "cashbackReversal"];

const WALLET_ROW_COLUMNS =
    "transactions.id, DATE(transactions.transactionDate) AS entryDate, " +
    "transactions.corporateTxnId AS reference, transactions.transactionCategory AS category, " +
    "transactions.providerId, " +
    `${SERVICE_SELECT}, ` +
    `${WALLET_POSTING_KEYS.map(key => postingSelect(key)).join(", ")}, ` +
    `CASE WHEN orders.id IS NOT NULL AND ${flooredAfter("DATE(orders.transactionDate)")} THEN 1 ELSE 0 END AS postingDue`;

const fundingLabel = (category, by) => {
    if (category === FUNDING_CATEGORIES.topUp) {
        return { particulars: "Wallet top-up", type: "Top-up" };
    }
    if (category === FUNDING_CATEGORIES.adminWithdrawal) {
        return { particulars: `Funds withdrawn by ${by || "admin"}`, type: "Admin withdrawal" };
    }
    return { particulars: `Funds added by ${by || "admin"}`, type: "Admin credit" };
};

const walletLines = row => {
    const debit = toNumber(row.debitAmount);
    const credit = toNumber(row.creditAmount);
    const base = { date: row.entryDate, reference: row.reference };
    const lines = [];

    if (FUNDING_SET.has(row.category)) {
        const label = fundingLabel(row.category, row.providerId);
        if (credit > 0) lines.push(entryRow({ ...base, ...label, side: CREDIT, amount: credit }));
        if (debit > 0) lines.push(entryRow({ ...base, ...label, side: DEBIT, amount: debit }));
        if (credit < 0) lines.push(entryRow({ ...base, ...label, side: DEBIT, amount: -credit }));
        if (debit < 0) lines.push(entryRow({ ...base, ...label, side: CREDIT, amount: -debit }));
        return lines;
    }

    const service = row.service || "Order";
    const expected = toNumber(row.postingDue) === 1;
    const postingOf = key => eventPosting(factsOfRow(row, key), { expected });

    if (debit > 0) {
        lines.push(
            entryRow({
                ...base,
                particulars: `Purchase — ${service}`,
                type: "Purchase",
                side: DEBIT,
                amount: debit,
                posting: postingOf(SALE_KEY),
            })
        );
    }
    if (debit < 0) {
        lines.push(
            entryRow({
                ...base,
                particulars: `Refund — ${service}`,
                type: "Refund",
                side: CREDIT,
                amount: -debit,
                posting: postingOf(refundKeyOfRow(row)),
            })
        );
    }
    if (credit > 0) {
        lines.push(
            entryRow({
                ...base,
                particulars: `Cashback — ${service}`,
                type: "Cashback",
                side: CREDIT,
                amount: credit,
                posting: postingOf("cashback"),
            })
        );
    }
    if (credit < 0) {
        lines.push(
            entryRow({
                ...base,
                particulars: `Cashback reversed — ${service}`,
                type: "Cashback reversal",
                side: DEBIT,
                amount: -credit,
                posting: postingOf("cashbackReversal"),
            })
        );
    }

    return lines;
};

module.exports = {
    WALLET_ROW_COLUMNS,
    FUNDING_SET,
    walletLines,
};
