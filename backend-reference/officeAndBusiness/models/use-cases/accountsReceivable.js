const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const invoicingV2 = require("../entities/invoicingV2");
const { enumerateMonths } = require("../../utils/monthRange");

const num = (v) => Number(v) || 0;
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_CUSTOMERS = 6;

const invoiceWhere = (p) => {
    const where = {
        corporateUserId: p.corporateUserId,
        documentType: "INVOICE",
        status: { [Op.ne]: "CANCELLED" },
    };
    if (p.from && p.to) where.invoiceDate = { [Op.between]: [p.from, p.to] };
    else if (p.from) where.invoiceDate = { [Op.gte]: p.from };
    else if (p.to) where.invoiceDate = { [Op.lte]: p.to };
    return where;
};

// Status from amounts + due date, not the document's mixed-purpose status enum.
const deriveStatus = (inv, today) => {
    const due = num(inv.amountDue);
    if (due <= 0) return "paid";
    if (inv.dueDate && new Date(inv.dueDate).getTime() < today) return "overdue";
    if (num(inv.amountPaid) > 0) return "partial";
    return "unpaid";
};

const agingKey = (daysOverdue) => {
    if (daysOverdue <= 30) return "d0_30";
    if (daysOverdue <= 60) return "d31_60";
    if (daysOverdue <= 90) return "d61_90";
    return "d90";
};

const distributionTone = (statuses) => {
    if (statuses.has("overdue")) return "danger";
    if (statuses.has("partial")) return "warning";
    return "neutral";
};

exports.findAccountsReceivable = asyncHandler(async (p) => {
    const today = Date.now();
    const horizon = today + 30 * DAY_MS;

    const rows = await invoicingV2.findAll({
        where: invoiceWhere(p),
        attributes: [
            "name",
            "prefix",
            "invoiceNumber",
            "invoiceDate",
            "dueDate",
            "totalAmount",
            "amountPaid",
            "amountDue",
        ],
        order: [["invoiceDate", "ASC"]],
        raw: true,
    });

    const invoices = [];
    const totals = { amount: 0, paid: 0, outstanding: 0, count: 0 };
    const collection = { collectionRate: 0, avgDaysOutstanding: 0, overdueAmount: 0, upcomingAmount: 0 };
    const breakdown = { collected: 0, outstanding: 0, overdue: 0 };
    const agingByCustomer = new Map();
    const distByCustomer = new Map();
    const trendByMonth = new Map();
    let openDaysSum = 0;
    let openCount = 0;

    rows.forEach((inv) => {
        const amount = num(inv.totalAmount);
        const paid = num(inv.amountPaid);
        const outstanding = num(inv.amountDue);
        const status = deriveStatus(inv, today);
        const dueTime = inv.dueDate ? new Date(inv.dueDate).getTime() : null;
        const pastDue = dueTime != null && dueTime < today && outstanding > 0;

        invoices.push({
            customer: inv.name,
            invoiceNo: `${inv.prefix || ""}${inv.invoiceNumber}`,
            invoiceDate: inv.invoiceDate,
            dueDate: inv.dueDate,
            amount,
            paid,
            outstanding,
            status,
            pastDue,
        });

        totals.amount += amount;
        totals.paid += paid;
        totals.outstanding += outstanding;
        totals.count += 1;

        breakdown.collected += paid;
        if (pastDue) {
            collection.overdueAmount += outstanding;
            breakdown.overdue += outstanding;
        } else {
            breakdown.outstanding += outstanding;
            if (dueTime != null && dueTime >= today && dueTime <= horizon)
                collection.upcomingAmount += outstanding;
        }

        if (outstanding > 0) {
            openCount += 1;
            openDaysSum += Math.max(0, Math.floor((today - new Date(inv.invoiceDate).getTime()) / DAY_MS));

            const daysOverdue = dueTime != null ? Math.floor((today - dueTime) / DAY_MS) : 0;
            const bucket = agingKey(daysOverdue);
            const ag =
                agingByCustomer.get(inv.name) ||
                { customer: inv.name, d0_30: 0, d31_60: 0, d61_90: 0, d90: 0 };
            ag[bucket] += outstanding;
            agingByCustomer.set(inv.name, ag);

            const dist = distByCustomer.get(inv.name) || { customer: inv.name, amount: 0, statuses: new Set() };
            dist.amount += outstanding;
            dist.statuses.add(status);
            distByCustomer.set(inv.name, dist);

            const ym = String(inv.invoiceDate).slice(0, 7);
            trendByMonth.set(ym, (trendByMonth.get(ym) || 0) + outstanding);
        }
    });

    collection.collectionRate = totals.amount > 0 ? (totals.paid / totals.amount) * 100 : 0;
    collection.avgDaysOutstanding = openCount > 0 ? Math.round(openDaysSum / openCount) : 0;

    const agingRows = [...agingByCustomer.values()].sort(
        (a, b) => b.d0_30 + b.d31_60 + b.d61_90 + b.d90 - (a.d0_30 + a.d31_60 + a.d61_90 + a.d90)
    );
    const agingTotals = agingRows.reduce(
        (acc, r) => ({
            d0_30: acc.d0_30 + r.d0_30,
            d31_60: acc.d31_60 + r.d31_60,
            d61_90: acc.d61_90 + r.d61_90,
            d90: acc.d90 + r.d90,
        }),
        { d0_30: 0, d31_60: 0, d61_90: 0, d90: 0 }
    );

    const distribution = [...distByCustomer.values()]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, TOP_CUSTOMERS)
        .map((d) => ({ customer: d.customer, amount: d.amount, tone: distributionTone(d.statuses) }));

    // Cumulative outstanding by invoice month (origination view; no payment-dated history).
    // When the period is bounded, emit every month in the range so the chart x-axis is
    // continuous; months with no new invoices carry the running total forward (a cumulative
    // series can't drop to 0 for a gap). Otherwise fall back to data-only months.
    let running = 0;
    const allMonths = enumerateMonths(p.from, p.to);
    const trendMonths = allMonths || [...trendByMonth.keys()].sort((a, b) => a.localeCompare(b));
    const trend = trendMonths.map((month) => {
        running += trendByMonth.get(month) || 0;
        return { month, value: running };
    });

    return {
        period: { from: p.from || null, to: p.to || null },
        invoices,
        totals,
        aging: { rows: agingRows, totals: agingTotals },
        distribution,
        trend,
        collection,
        breakdown,
    };
});
