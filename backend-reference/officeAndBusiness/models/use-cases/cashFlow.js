const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const accountingTransaction = require("../entities/accountingTransaction");
const cashFlowEntry = require("../entities/cashFlowEntry");
const { SECTIONS } = require("../../utils/cashFlowConfig");
const { findBalanceSheet } = require("./balanceSheet");

const num = (v) => Number(v) || 0;
// Cash flow amounts are integer rupees.
const round0 = (v) => Math.round(num(v));

const iso = (d) => d.toISOString().slice(0, 10);
const dayBefore = (dateStr) => {
    const d = new Date(dateStr);
    d.setUTCDate(d.getUTCDate() - 1);
    return iso(d);
};

const ownerWhere = (p) => {
    const where = { corporateUserId: p.corporateUserId };
    if (p.subCorporateUserId) where.subCorporateUserId = p.subCorporateUserId;
    return where;
};

// Net cash (Income - Expense) over an inclusive date range; the ledger is cash-basis so
// this is both the period's net profit and (cumulatively) the cash position at a date.
const netForRange = async (p, from, to) => {
    const where = { ...ownerWhere(p), isHidden: false };
    if (from && to) where.txnDate = { [Op.between]: [from, to] };
    else if (to) where.txnDate = { [Op.lte]: to };
    else if (from) where.txnDate = { [Op.gte]: from };
    const rows = await accountingTransaction.findAll({
        where,
        attributes: ["type", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
        group: ["type"],
        raw: true,
    });
    let income = 0;
    let expense = 0;
    rows.forEach((r) => {
        if (r.type === "Income") income = num(r.total);
        else expense = num(r.total);
    });
    return income - expense;
};

// Pure assembly from already-fetched inputs (no DB) — kept separate so the section/net/
// summary math is unit-testable. `entries` are raw {section, head, amount} rows; `derived`
// holds computed values referenced by template `derived` keys (e.g. balance-sheet totals).
const assembleCashFlow = ({ from, to, openingBalance, entries, derived = {} }) => {
    // Sum stored amounts by (section, head).
    const map = new Map();
    entries.forEach((e) => {
        const k = `${e.section}|${e.head}`;
        map.set(k, (map.get(k) || 0) + round0(e.amount));
    });

    const used = new Set();
    const sections = SECTIONS.map((sec) => {
        const lineItems = [];
        sec.template.forEach((t) => {
            if (t.isSubheading) {
                lineItems.push({ head: t.head, isSubheading: true });
                return;
            }
            if (t.derived) {
                lineItems.push({
                    head: t.head,
                    amount: round0(derived[t.derived]),
                    ...(t.isTotal ? { isTotal: true } : {}),
                });
                return;
            }
            const k = `${sec.key}|${t.head}`;
            used.add(k);
            lineItems.push({ head: t.head, amount: map.get(k) || 0 });
        });
        // Append any stored heads for this section not covered by the template.
        map.forEach((amount, k) => {
            if (used.has(k) || !k.startsWith(`${sec.key}|`)) return;
            used.add(k);
            lineItems.push({ head: k.slice(sec.key.length + 1), amount });
        });

        // Context totals (isTotal) are shown but excluded from the section net.
        const net = lineItems
            .filter((li) => !li.isSubheading && !li.isTotal)
            .reduce((s, li) => s + li.amount, 0);
        return { key: sec.key, title: sec.title, lineItems, net: { label: sec.netLabel, amount: net } };
    });

    const netCashFlow = sections.reduce((s, sec) => s + sec.net.amount, 0);
    const open = round0(openingBalance);
    return {
        range: { from: from || null, to: to || null },
        method: "indirect",
        sections,
        summary: {
            openingBalance: open,
            netCashFlow,
            closingBalance: open + netCashFlow,
        },
    };
};

/**
 * Cash Flow Statement (indirect method). The opening cash balance is derived from the
 * ledger; non-cash adjustments, working-capital changes and the investing/financing lines
 * come from stored cashFlowEntries within [from, to]. The operating section also shows two
 * balance-sheet context totals — Total Current Assets and Total Assets (as of the period
 * end) — which are displayed but excluded from the operating net. Guarantees: each section
 * net = sum of its non-subheading/non-total line items; netCashFlow = sum of section nets;
 * closingBalance = openingBalance + netCashFlow.
 */
exports.findCashFlowStatement = asyncHandler(async (p) => {
    const { from, to } = p;
    const asOf = to || new Date().toISOString().slice(0, 10);
    const [openingBalance, entries, balanceSheet] = await Promise.all([
        from ? netForRange(p, null, dayBefore(from)) : Promise.resolve(0),
        cashFlowEntry.findAll({
            where: {
                ...ownerWhere(p),
                isActive: true,
                ...(from && to
                    ? { txnDate: { [Op.between]: [from, to] } }
                    : to
                    ? { txnDate: { [Op.lte]: to } }
                    : from
                    ? { txnDate: { [Op.gte]: from } }
                    : {}),
            },
            attributes: ["section", "head", "amount"],
            raw: true,
        }),
        findBalanceSheet({
            corporateUserId: p.corporateUserId,
            subCorporateUserId: p.subCorporateUserId,
            asOf,
        }),
    ]);

    const assets = balanceSheet?.statement?.assets || {};
    const derived = {
        totalCurrentAssets: assets.totalCurrentAssets || 0,
        totalAssets: assets.totalAssets || 0,
    };
    return assembleCashFlow({ from, to, openingBalance, entries, derived });
});

// Exposed for unit tests — pure section/net/summary assembly (no DB).
exports._assembleCashFlow = assembleCashFlow;
