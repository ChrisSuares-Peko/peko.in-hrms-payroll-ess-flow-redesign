const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const accountingTransaction = require("../entities/accountingTransaction");
const cashFlowEntry = require("../entities/cashFlowEntry");

const num = (v) => Number(v) || 0;
const round0 = (v) => Math.round(num(v));
const iso = (d) => d.toISOString().slice(0, 10);
const MONTH_FMT = Sequelize.fn("DATE_FORMAT", Sequelize.col("txnDate"), "%Y-%m");
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

const dateWhere = (from, to) => {
    if (from && to) return { txnDate: { [Op.between]: [from, to] } };
    if (to) return { txnDate: { [Op.lte]: to } };
    if (from) return { txnDate: { [Op.gte]: from } };
    return {};
};

// Net cash (Income - Expense) over a range; cash-basis, so also the cumulative balance.
const netForRange = async (p, from, to) => {
    const rows = await accountingTransaction.findAll({
        where: { ...ownerWhere(p), isHidden: false, ...dateWhere(from, to) },
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

// Stored cash-flow entry totals per section over [from, to].
const storedBySection = async (p, from, to) => {
    const rows = await cashFlowEntry.findAll({
        where: { ...ownerWhere(p), isActive: true, ...dateWhere(from, to) },
        attributes: ["section", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
        group: ["section"],
        raw: true,
    });
    const out = { operating: 0, investing: 0, financing: 0 };
    rows.forEach((r) => {
        out[r.section] = num(r.total);
    });
    return out;
};

// Period nets by activity: operating = Net Profit (derived) + stored operating entries;
// investing/financing = stored entries. Plus opening cash and derived closing balance.
const periodNets = async (p, from, to) => {
    const [netProfit, stored, opening] = await Promise.all([
        netForRange(p, from, to),
        storedBySection(p, from, to),
        from ? netForRange(p, null, dayBefore(from)) : Promise.resolve(0),
    ]);
    const operating = round0(netProfit + stored.operating);
    const investing = round0(stored.investing);
    const financing = round0(stored.financing);
    const netCashFlow = operating + investing + financing;
    const open = round0(opening);
    return { operating, investing, financing, netCashFlow, opening: open, closingBalance: open + netCashFlow };
};

// Calendar months (YYYY-MM) spanning [from, to] inclusive.
const monthList = (from, to) => {
    const start = new Date(from);
    const end = new Date(to);
    const months = [];
    let y = start.getUTCFullYear();
    let m = start.getUTCMonth();
    while (y < end.getUTCFullYear() || (y === end.getUTCFullYear() && m <= end.getUTCMonth())) {
        months.push(`${y}-${String(m + 1).padStart(2, "0")}`);
        m += 1;
        if (m > 11) {
            m = 0;
            y += 1;
        }
    }
    return months;
};

// Per-month net by activity across [from, to].
const monthlyNets = async (p, from, to) => {
    const [profitRows, entryRows] = await Promise.all([
        accountingTransaction.findAll({
            where: { ...ownerWhere(p), isHidden: false, txnDate: { [Op.between]: [from, to] } },
            attributes: [[MONTH_FMT, "ym"], "type", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
            group: [MONTH_FMT, "type"],
            raw: true,
        }),
        cashFlowEntry.findAll({
            where: { ...ownerWhere(p), isActive: true, txnDate: { [Op.between]: [from, to] } },
            attributes: [[MONTH_FMT, "ym"], "section", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
            group: [MONTH_FMT, "section"],
            raw: true,
        }),
    ]);

    const profitByMonth = new Map();
    profitRows.forEach((r) => {
        const cur = profitByMonth.get(r.ym) || 0;
        profitByMonth.set(r.ym, cur + (r.type === "Income" ? num(r.total) : -num(r.total)));
    });
    const storedByMonth = new Map();
    entryRows.forEach((r) => {
        const b = storedByMonth.get(r.ym) || { operating: 0, investing: 0, financing: 0 };
        b[r.section] = num(r.total);
        storedByMonth.set(r.ym, b);
    });

    return monthList(from, to).map((ym) => {
        const s = storedByMonth.get(ym) || { operating: 0, investing: 0, financing: 0 };
        return {
            month: ym,
            operating: round0((profitByMonth.get(ym) || 0) + s.operating),
            investing: round0(s.investing),
            financing: round0(s.financing),
        };
    });
};

// Immediately-preceding period of equal length (prior FY for a full FY, prior month, etc.).
const priorWindow = (from, to) => {
    if (!from || !to) return { from: null, to: null };
    const f = new Date(from);
    const t = new Date(to);
    const days = Math.round((t - f) / 86400000);
    const priorTo = new Date(f);
    priorTo.setUTCDate(priorTo.getUTCDate() - 1);
    const priorFrom = new Date(priorTo);
    priorFrom.setUTCDate(priorFrom.getUTCDate() - days);
    return { from: iso(priorFrom), to: iso(priorTo) };
};

const deltaUp = (cur, prior) => {
    if (prior === null || prior === undefined || prior === 0) return { deltaPercent: null, up: cur >= 0 };
    const deltaPercent = Math.round(((cur - prior) / Math.abs(prior)) * 100);
    return { deltaPercent, up: deltaPercent >= 0 };
};
const metric = (cur, prior) => ({ value: cur, ...deltaUp(cur, prior) });

// Pure assembly from already-fetched inputs (no DB) — unit-testable. `current`/`prior`
// are period-net objects; `monthly` is the per-month net-by-activity series.
const assembleOverview = ({ from, to, opening, monthly, current, prior }) => {
    const summary = {
        operating: metric(current.operating, prior ? prior.operating : null),
        investing: metric(current.investing, prior ? prior.investing : null),
        financing: metric(current.financing, prior ? prior.financing : null),
        netCashFlow: metric(current.netCashFlow, prior ? prior.netCashFlow : null),
        closingBalance: metric(current.closingBalance, prior ? prior.closingBalance : null),
    };

    const trend = monthly.map((m) => ({
        month: m.month,
        operating: m.operating,
        investing: m.investing,
        financing: m.financing,
    }));

    // Running cash balance at each month-end: opening + cumulative monthly net.
    let bal = round0(opening);
    const balanceProgression = monthly.map((m) => {
        bal += m.operating + m.investing + m.financing;
        return { month: m.month, balance: bal };
    });

    return { range: { from: from || null, to: to || null }, summary, trend, balanceProgression };
};

/**
 * Cash Flow Overview: 5 stat cards (operating / investing / financing / netCashFlow /
 * closingBalance, each with a YoY-comparable-period deltaPercent + favourable flag), a
 * monthly net-by-activity trend, and a monthly running-balance progression. Net Profit
 * and opening cash are derived from the ledger; the rest come from stored cashFlowEntries.
 * closingBalance == last balanceProgression value == opening + sum(monthly nets).
 */
exports.findCashFlowOverview = asyncHandler(async (p) => {
    const { from, to } = p;
    const prior = priorWindow(from, to);
    const bounded = Boolean(from && to);
    const [current, priorNets, monthly] = await Promise.all([
        periodNets(p, from, to),
        bounded ? periodNets(p, prior.from, prior.to) : Promise.resolve(null),
        bounded ? monthlyNets(p, from, to) : Promise.resolve([]),
    ]);
    return assembleOverview({ from, to, opening: current.opening, monthly, current, prior: priorNets });
});

// Exposed for unit tests — pure summary/trend/progression assembly (no DB).
exports._assembleOverview = assembleOverview;
