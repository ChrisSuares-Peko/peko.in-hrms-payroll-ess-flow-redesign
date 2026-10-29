const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const accountingTransaction = require("../entities/accountingTransaction");
const financialAccount = require("../entities/financialAccount");
const { findAccountsReceivable } = require("./accountsReceivable");
const { SECTIONS, SECTION_ORDER, classify } = require("../../utils/plClassification");
const { enumerateMonths } = require("../../utils/monthRange");

// Reporting reads exclude hidden rows and are scoped to the corporate (+ optional
// sub-user) and an optional date range — the same visibility rules as the ledger.
const baseWhere = (p) => {
    const where = { corporateUserId: p.corporateUserId, isHidden: false };
    if (p.subCorporateUserId) where.subCorporateUserId = p.subCorporateUserId;
    if (p.from && p.to) where.txnDate = { [Op.between]: [p.from, p.to] };
    else if (p.from) where.txnDate = { [Op.gte]: p.from };
    else if (p.to) where.txnDate = { [Op.lte]: p.to };
    // Optional category search — partial, case-insensitive (MySQL ci collation).
    if (p.category) where.category = { [Op.like]: `%${p.category}%` };
    return where;
};

const num = (v) => Number(v) || 0;
const MONTH_FMT = Sequelize.fn("DATE_FORMAT", Sequelize.col("txnDate"), "%Y-%m");

/**
 * Aggregations that power the Expense / Revenue / P&L reports, derived from the
 * accountingTransactions ledger (no separate GL): per-type totals, category
 * breakdowns, a monthly income/expense trend, and the top counterparties (by the
 * transaction description, our best proxy until a vendor/customer master exists).
 */
exports.findAccountingReportSummary = asyncHandler(async (p) => {
    const where = baseWhere(p);

    const [byCategory, byMonth, byParty] = await Promise.all([
        accountingTransaction.findAll({
            where,
            attributes: [
                "type",
                "category",
                [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["type", "category"],
            raw: true,
        }),
        accountingTransaction.findAll({
            where,
            attributes: [
                [MONTH_FMT, "ym"],
                "type",
                [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
            ],
            group: [MONTH_FMT, "type"],
            order: [[MONTH_FMT, "ASC"]],
            raw: true,
        }),
        accountingTransaction.findAll({
            where,
            attributes: [
                "type",
                "description",
                [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
            ],
            group: ["type", "description"],
            raw: true,
        }),
    ]);

    // --- Totals + per-type category breakdowns ---
    const totals = { income: { total: 0, count: 0 }, expense: { total: 0, count: 0 } };
    const categories = { income: [], expense: [] };
    byCategory.forEach((r) => {
        const bucket = r.type === "Income" ? "income" : "expense";
        const total = num(r.total);
        totals[bucket].total += total;
        totals[bucket].count += num(r.count);
        categories[bucket].push({
            category: r.category || "Uncategorized",
            total,
            count: num(r.count),
        });
    });
    categories.income.sort((a, b) => b.total - a.total);
    categories.expense.sort((a, b) => b.total - a.total);

    // --- Monthly income/expense trend ---
    const monthMap = new Map();
    byMonth.forEach((r) => {
        if (!monthMap.has(r.ym)) monthMap.set(r.ym, { month: r.ym, income: 0, expense: 0 });
        monthMap.get(r.ym)[r.type === "Income" ? "income" : "expense"] = num(r.total);
    });
    // When the period is bounded, emit every month in the range (0 for months with no
    // data) so the chart shows a continuous x-axis; otherwise fall back to data-only.
    const allMonths = enumerateMonths(p.from, p.to);
    const monthly = allMonths
        ? allMonths.map((ym) => monthMap.get(ym) || { month: ym, income: 0, expense: 0 })
        : [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month));

    // --- Top counterparties per type (by description) ---
    const parties = { income: [], expense: [] };
    byParty.forEach((r) => {
        const bucket = r.type === "Income" ? "income" : "expense";
        parties[bucket].push({ party: r.description, total: num(r.total) });
    });
    const topN = (arr) => arr.sort((a, b) => b.total - a.total).slice(0, 8);

    return {
        totals: {
            income: totals.income.total,
            expense: totals.expense.total,
            net: totals.income.total - totals.expense.total,
            incomeCount: totals.income.count,
            expenseCount: totals.expense.count,
        },
        byCategory: categories,
        monthly,
        topParties: { income: topN(parties.income), expense: topN(parties.expense) },
    };
});

/**
 * Detailed multi-step Profit & Loss statement, built from the transaction ledger.
 * Free-text categories are classified into P&L sections (see utils/plClassification);
 * unmatched categories fall back by type so the statement always reconciles to net
 * profit. Derives Gross Profit, Operating Profit, Profit Before Tax and Net Profit.
 */
exports.findDetailedProfitAndLoss = asyncHandler(async (p) => {
    const where = baseWhere(p);

    const rows = await accountingTransaction.findAll({
        where,
        attributes: [
            "type",
            "category",
            [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
            [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        group: ["type", "category"],
        raw: true,
    });

    // Accumulate signed line-item totals per section. Income-polarity sections
    // treat Income as + and Expense as - (contra, e.g. Discounts & Returns);
    // expense-polarity sections do the reverse.
    const buckets = {};
    SECTION_ORDER.forEach((k) => (buckets[k] = new Map()));

    rows.forEach((r) => {
        const { section, label } = classify(r.category, r.type);
        const polarity = SECTIONS[section].polarity;
        const signed =
            polarity === "income"
                ? r.type === "Income" ? num(r.total) : -num(r.total)
                : r.type === "Expense" ? num(r.total) : -num(r.total);
        const map = buckets[section];
        const prev = map.get(label) || { label, amount: 0, count: 0 };
        prev.amount += signed;
        prev.count += num(r.count);
        map.set(label, prev);
    });

    // Build ordered section objects (line items sorted by magnitude) + section total.
    const sectionTotals = {};
    const sections = SECTION_ORDER.map((key) => {
        const meta = SECTIONS[key];
        const lineItems = [...buckets[key].values()].sort(
            (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
        );
        const total = lineItems.reduce((s, li) => s + li.amount, 0);
        sectionTotals[key] = total;
        return {
            key,
            title: meta.title,
            totalLabel: meta.totalLabel,
            total,
            lineItems: lineItems.map((li) => ({
                label: li.label,
                amount: li.amount,
                count: li.count,
                ...(li.amount < 0 ? { isContra: true } : {}),
            })),
        };
    });

    // Multi-step P&L waterfall.
    const totalRevenue = sectionTotals.revenue;
    const totalCogs = sectionTotals.cogs;
    const grossProfit = totalRevenue - totalCogs;
    const totalOperatingExpenses = sectionTotals.operatingExpenses;
    const operatingProfit = grossProfit - totalOperatingExpenses;
    const totalOtherIncome = sectionTotals.otherIncome;
    const totalOtherExpenses = sectionTotals.otherExpenses;
    const profitBeforeTax = operatingProfit + totalOtherIncome - totalOtherExpenses;
    const tax = sectionTotals.tax;
    const netProfit = profitBeforeTax - tax;

    return {
        range: { from: p.from || null, to: p.to || null },
        sections,
        summary: {
            totalRevenue,
            totalCogs,
            grossProfit,
            totalOperatingExpenses,
            operatingProfit,
            totalOtherIncome,
            totalOtherExpenses,
            profitBeforeTax,
            tax,
            netProfit,
        },
    };
});

const RECURRING_TOP_N = 5;

exports.findAccountingInsights = asyncHandler(async (p) => {
    const where = baseWhere(p);

    const [
        summary,
        bySource,
        needsReview,
        recurringCount,
        uncategorized,
        recurringRows,
        byAccount,
    ] = await Promise.all([
        exports.findAccountingReportSummary(p),
        accountingTransaction.findAll({
            where,
            attributes: [
                "account",
                [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
                [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
            ],
            group: ["account"],
            raw: true,
        }),
        accountingTransaction.count({ where: { ...where, reviewedAt: null } }),
        accountingTransaction.count({ where: { ...where, isRecurring: true } }),
        accountingTransaction.count({ where: { ...where, category: null } }),
        accountingTransaction.findAll({
            where: { ...where, type: "Expense", isRecurring: true },
            attributes: [
                "description",
                [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
            ],
            group: ["description"],
            raw: true,
        }),
        accountingTransaction.findAll({
            where,
            include: [{ model: financialAccount, as: "financialAccount", attributes: [] }],
            attributes: [
                "bankAccountId",
                [Sequelize.col("financialAccount.accountName"), "accountName"],
                "type",
                [Sequelize.fn("SUM", Sequelize.col("amount")), "total"],
            ],
            group: ["bankAccountId", "financialAccount.accountName", "type"],
            raw: true,
        }),
    ]);

    const sources = bySource.map((r) => ({
        account: r.account,
        total: num(r.total),
        count: num(r.count),
    }));

    const recurringSorted = recurringRows
        .map((r) => ({ name: r.description, total: num(r.total) }))
        .sort((a, b) => b.total - a.total);
    const committed = recurringSorted.reduce((s, r) => s + r.total, 0);
    const recurring = {
        committed,
        items: recurringSorted.slice(0, RECURRING_TOP_N),
        moreCount: Math.max(0, recurringSorted.length - RECURRING_TOP_N),
    };

    // Inflow/outflow sums per account (not running balances — no balance columns).
    const accountMap = new Map();
    byAccount.forEach((r) => {
        const key = r.bankAccountId || 0;
        if (!accountMap.has(key)) {
            accountMap.set(key, {
                id: r.bankAccountId || null,
                name: r.accountName || "Unassigned",
                inflow: 0,
                outflow: 0,
            });
        }
        const acc = accountMap.get(key);
        if (r.type === "Income") acc.inflow += num(r.total);
        else acc.outflow += num(r.total);
    });

    return {
        period: { from: p.from || null, to: p.to || null },
        totals: summary.totals,
        byCategory: summary.byCategory,
        topParties: summary.topParties,
        monthly: summary.monthly,
        sources,
        attention: {
            needsReview,
            recurringCount,
            uncategorized,
            totalCount: summary.totals.incomeCount + summary.totals.expenseCount,
        },
        recurring,
        accounts: [...accountMap.values()],
    };
});

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Prior equivalent period: shift a YYYY-MM-DD date back exactly one year (date-only, UTC).
const shiftYearBack = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    dt.setUTCFullYear(dt.getUTCFullYear() - 1);
    return dt.toISOString().slice(0, 10);
};

const pendingMetric = (key, label) => ({ key, label, value: "—", percent: 0, pending: true });

/**
 * Composite "business health" score (0-100) built from real signals: YoY revenue growth, profit
 * margin, cash-flow consistency, and receivables health. GST compliance has no data source yet
 * (no filing/return tracker), so it is returned as a pending metric and excluded from the overall
 * score. Normalisation constants are deliberately simple, documented, tunable heuristics.
 */
exports.findBusinessHealth = asyncHandler(async (p) => {
    const hasRange = Boolean(p.from && p.to);
    const [current, prior, ar] = await Promise.all([
        exports.findAccountingReportSummary(p),
        hasRange
            ? exports.findAccountingReportSummary({
                  ...p,
                  from: shiftYearBack(p.from),
                  to: shiftYearBack(p.to),
              })
            : Promise.resolve(null),
        findAccountsReceivable({ corporateUserId: p.corporateUserId, from: p.from, to: p.to }),
    ]);

    const { income, net } = current.totals;
    const metrics = [];

    // 1) Revenue growth (YoY) — requires a prior period. +25% -> 100, flat -> 50, -25% -> 0.
    let revenueGrowthScore = null;
    if (prior) {
        const priorIncome = prior.totals.income;
        let growthPct;
        if (priorIncome > 0) growthPct = ((income - priorIncome) / priorIncome) * 100;
        else growthPct = income > 0 ? 100 : 0;
        revenueGrowthScore = clamp(50 + growthPct * 2, 0, 100);
        const sign = growthPct >= 0 ? "+" : "";
        metrics.push({
            key: "revenue-growth",
            label: "Revenue Growth",
            value: `${sign}${growthPct.toFixed(0)}%`,
            percent: Math.round(revenueGrowthScore),
            pending: false,
        });
    } else {
        metrics.push(pendingMetric("revenue-growth", "Revenue Growth"));
    }

    // 2) Profit margin — 20% margin maps to 100; negative margin to 0.
    const margin = income > 0 ? (net / income) * 100 : 0;
    const profitMarginScore = clamp(margin * 5, 0, 100);
    metrics.push({
        key: "profit-margin",
        label: "Profit Margin",
        value: `${margin.toFixed(1)}%`,
        percent: Math.round(profitMarginScore),
        pending: false,
    });

    // 3) Cash flow — share of months WITH activity that had positive net cash. Empty
    // months (0 income/0 expense, present so charts are continuous) are excluded so they
    // don't skew the score.
    const months = (current.monthly || []).filter((m) => num(m.income) !== 0 || num(m.expense) !== 0);
    let cashFlowScore = null;
    if (months.length > 0) {
        const positive = months.filter((m) => num(m.income) >= num(m.expense)).length;
        cashFlowScore = (positive / months.length) * 100;
        metrics.push({
            key: "cash-flow",
            label: "Cash Flow",
            value: `${positive}/${months.length} mo`,
            percent: Math.round(cashFlowScore),
            pending: false,
        });
    } else {
        metrics.push(pendingMetric("cash-flow", "Cash Flow"));
    }

    // 4) GST compliance — no filing/return data tracked yet; pending, excluded from the score.
    metrics.push(pendingMetric("gst-compliance", "GST Compliance"));

    // 5) AR health — collection rate, penalised by the overdue share of outstanding.
    let arHealthScore = null;
    if (ar.totals.amount > 0) {
        const { outstanding } = ar.totals;
        const overduePct = outstanding > 0 ? (ar.collection.overdueAmount / outstanding) * 100 : 0;
        arHealthScore = clamp(ar.collection.collectionRate - overduePct * 0.5, 0, 100);
        metrics.push({
            key: "ar-health",
            label: "AR Health",
            value: `${Math.round(ar.collection.collectionRate)}% collected`,
            percent: Math.round(arHealthScore),
            pending: false,
        });
    } else {
        metrics.push(pendingMetric("ar-health", "AR Health"));
    }

    // Overall = mean of the available (non-pending) component scores.
    const available = [revenueGrowthScore, profitMarginScore, cashFlowScore, arHealthScore].filter(
        (s) => s !== null
    );
    const score = available.length
        ? Math.round(available.reduce((a, b) => a + b, 0) / available.length)
        : 0;

    return { period: { from: p.from || null, to: p.to || null }, score, metrics };
});
