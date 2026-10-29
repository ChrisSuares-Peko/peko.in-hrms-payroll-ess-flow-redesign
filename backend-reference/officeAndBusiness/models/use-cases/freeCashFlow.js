const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const accountingTransaction = require("../entities/accountingTransaction");
const cashFlowEntry = require("../entities/cashFlowEntry");
const { SECTIONS } = require("../../utils/cashFlowConfig");
const { enumerateMonths } = require("../../utils/monthRange");

const num = (v) => Number(v) || 0;
const round0 = (v) => Math.round(num(v));
const round1 = (v) => Math.round((num(v) + Number.EPSILON) * 10) / 10;
const MONTH_FMT = Sequelize.fn("DATE_FORMAT", Sequelize.col("txnDate"), "%Y-%m");

// Display order + label cleanup for capex items, from the investing template.
const INVESTING_HEADS = SECTIONS.find((s) => s.key === "investing").template.map((t) => t.head);
const LABEL_PREFIXES = ["Purchase of ", "Investment in ", "Acquisition of "];
const cleanLabel = (head) => {
    const pre = LABEL_PREFIXES.find((x) => head.startsWith(x));
    return pre ? head.slice(pre.length) : head;
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

// Net cash (Income - Expense) over a range — the period's net profit (cash-basis).
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

// Per-month Operating CF / capex / FCF across [from, to] (bounded ranges only — a
// monthly series needs endpoints). Operating CF per month = that month's derived Net
// Profit + stored operating entries; capex per month = that month's stored investing
// outflows (negative entries), summed as a positive magnitude.
const monthlyTrend = async (p, from, to) => {
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

    const operatingByMonth = new Map();
    const capexByMonth = new Map();
    entryRows.forEach((r) => {
        if (r.section === "operating") {
            operatingByMonth.set(r.ym, (operatingByMonth.get(r.ym) || 0) + num(r.total));
        } else if (r.section === "investing" && num(r.total) < 0) {
            capexByMonth.set(r.ym, (capexByMonth.get(r.ym) || 0) + Math.abs(num(r.total)));
        }
    });

    return (enumerateMonths(from, to) || []).map((ym) => {
        const operatingCashFlow = round0((profitByMonth.get(ym) || 0) + (operatingByMonth.get(ym) || 0));
        const capex = round0(capexByMonth.get(ym) || 0);
        return { month: ym, operatingCashFlow, capex, freeCashFlow: operatingCashFlow - capex };
    });
};

// Pure assembly (no DB). `operating` = Operating CF; `investingByHead` = net investing
// amount per stored head (signed). Capex = investing outflows (net-negative heads),
// reported as positive magnitudes; FCF = Operating CF - total capex. `trend` is the
// pre-built monthly series (empty for an unbounded range).
const assembleFreeCashFlow = ({ from, to, operating, investingByHead, trend }) => {
    const op = round0(operating);
    const order = (h) => {
        const i = INVESTING_HEADS.indexOf(h);
        return i === -1 ? INVESTING_HEADS.length : i;
    };

    const outflows = investingByHead
        .map((h) => ({ head: h.head, amount: round0(h.amount) }))
        .filter((h) => h.amount < 0)
        .sort((a, b) => order(a.head) - order(b.head));
    const total = outflows.reduce((s, h) => s + Math.abs(h.amount), 0);
    const items = outflows.map((h) => ({
        label: cleanLabel(h.head),
        amount: Math.abs(h.amount),
        percent: total > 0 ? round1((Math.abs(h.amount) / total) * 100) : 0,
    }));

    const investingNet = round0(investingByHead.reduce((s, h) => s + num(h.amount), 0));
    const fcf = op - total;

    return {
        range: { from: from || null, to: to || null },
        freeCashFlow: {
            value: fcf,
            pctOfOperating: op !== 0 ? round1((fcf / op) * 100) : null,
        },
        capex: { total, items },
        capexRatio: { value: op !== 0 ? round1((Math.abs(investingNet) / op) * 100) : null },
        trend: trend || [],
    };
};

/**
 * Free Cash Flow analysis: FCF = Operating CF - Capex, the capex breakdown by asset head,
 * and the capex ratio (|Net Investing CF| / Operating CF). Operating CF = derived Net
 * Profit + stored operating entries; capex/investing come from stored investing entries.
 */
exports.findFreeCashFlow = asyncHandler(async (p) => {
    const { from, to } = p;
    const bounded = Boolean(from && to);
    const [netProfit, rows, trend] = await Promise.all([
        netForRange(p, from, to),
        cashFlowEntry.findAll({
            where: { ...ownerWhere(p), isActive: true, ...dateWhere(from, to) },
            attributes: ["section", "head", [Sequelize.fn("SUM", Sequelize.col("amount")), "total"]],
            group: ["section", "head"],
            raw: true,
        }),
        bounded ? monthlyTrend(p, from, to) : Promise.resolve([]),
    ]);

    let storedOperating = 0;
    const investingByHead = [];
    rows.forEach((r) => {
        if (r.section === "operating") storedOperating += num(r.total);
        else if (r.section === "investing") investingByHead.push({ head: r.head, amount: num(r.total) });
    });

    return assembleFreeCashFlow({ from, to, operating: netProfit + storedOperating, investingByHead, trend });
});

// Exposed for unit tests — pure FCF/capex/ratio assembly (no DB).
exports._assembleFreeCashFlow = assembleFreeCashFlow;
