const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const vendorBill = require("../entities/vendorBill");

const num = (v) => Number(v) || 0;
const round0 = (v) => Math.round(num(v));
const round1 = (v) => Math.round((num(v) + Number.EPSILON) * 10) / 10;
const DAY = 24 * 60 * 60 * 1000;
const TOP_VENDORS = 6;

const ownerWhere = (p) => {
    const where = { corporateUserId: p.corporateUserId };
    if (p.subCorporateUserId) where.subCorporateUserId = p.subCorporateUserId;
    return where;
};

// Status from amounts + due date (mirrors the accounts-receivable logic).
const deriveStatus = (outstanding, paid, dueTime, today) => {
    if (outstanding <= 0) return "paid";
    if (dueTime != null && dueTime < today) return "overdue";
    if (paid > 0) return "partial";
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

// Pure assembly (no DB). `bills` are raw rows; `today` is a timestamp (ms) so the
// aging/overdue/due-soon math is deterministic and unit-testable.
const assembleAccountsPayable = ({ from, to, bills, today }) => {
    const horizon = today + 30 * DAY;

    const outBills = [];
    let billed = 0;
    const breakdown = { paid: 0, outstanding: 0, overdue: 0 };
    let overdueAmount = 0;
    let dueSoonAmount = 0;
    let payDaysSum = 0;
    let payCount = 0;
    const agingByVendor = new Map();
    const distByVendor = new Map();
    const trendByMonth = new Map();

    bills.forEach((b) => {
        const amount = round0(b.amount);
        const paid = round0(b.paid);
        const outstanding = amount - paid;
        const dueTime = b.dueDate ? new Date(b.dueDate).getTime() : null;
        const status = deriveStatus(outstanding, paid, dueTime, today);
        const pastDue = dueTime != null && dueTime < today && outstanding > 0;

        outBills.push({
            vendor: b.vendor,
            billNo: b.billNo || null,
            billDate: b.billDate,
            dueDate: b.dueDate || null,
            amount,
            paid,
            outstanding,
            status,
            pastDue,
        });

        billed += amount;
        breakdown.paid += paid;
        if (pastDue) {
            overdueAmount += outstanding;
            breakdown.overdue += outstanding;
        } else {
            breakdown.outstanding += outstanding;
            if (dueTime != null && dueTime >= today && dueTime <= horizon) dueSoonAmount += outstanding;
        }

        // Avg days payable: settlement date - bill date, for bills with a recorded payment.
        if (b.paidDate && paid > 0) {
            payDaysSum += Math.max(0, Math.floor((new Date(b.paidDate).getTime() - new Date(b.billDate).getTime()) / DAY));
            payCount += 1;
        }

        if (outstanding > 0) {
            const daysOverdue = dueTime != null ? Math.floor((today - dueTime) / DAY) : 0;
            const bucket = agingKey(daysOverdue);
            const ag =
                agingByVendor.get(b.vendor) || { vendor: b.vendor, d0_30: 0, d31_60: 0, d61_90: 0, d90: 0 };
            ag[bucket] += outstanding;
            agingByVendor.set(b.vendor, ag);

            const dist = distByVendor.get(b.vendor) || { vendor: b.vendor, amount: 0, statuses: new Set() };
            dist.amount += outstanding;
            dist.statuses.add(status);
            distByVendor.set(b.vendor, dist);

            const ym = String(b.billDate).slice(0, 7);
            trendByMonth.set(ym, (trendByMonth.get(ym) || 0) + outstanding);
        }
    });

    const agingRows = [...agingByVendor.values()]
        .sort((a, b) => b.d0_30 + b.d31_60 + b.d61_90 + b.d90 - (a.d0_30 + a.d31_60 + a.d61_90 + a.d90))
        .map((r) => ({
            vendor: r.vendor,
            d0_30: round0(r.d0_30),
            d31_60: round0(r.d31_60),
            d61_90: round0(r.d61_90),
            d90: round0(r.d90),
        }));

    const distribution = [...distByVendor.values()]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, TOP_VENDORS)
        .map((d) => ({ vendor: d.vendor, amount: round0(d.amount), tone: distributionTone(d.statuses) }));

    // Cumulative outstanding by bill month (origination view).
    let running = 0;
    const trend = [...trendByMonth.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, value]) => {
            running += value;
            return { month, value: round0(running) };
        });

    return {
        range: { from: from || null, to: to || null },
        bills: outBills,
        aging: { rows: agingRows },
        distribution,
        trend,
        payment: {
            paymentRate: billed > 0 ? round1((breakdown.paid / billed) * 100) : 0,
            avgDaysPayable: payCount > 0 ? Math.round(payDaysSum / payCount) : 0,
            overdueAmount: round0(overdueAmount),
            dueSoonAmount: round0(dueSoonAmount),
        },
        breakdown: {
            paid: round0(breakdown.paid),
            outstanding: round0(breakdown.outstanding),
            overdue: round0(breakdown.overdue),
        },
    };
};

/**
 * Accounts Payable analysis derived from stored vendorBills whose billDate falls in the
 * period: the bill list (with derived outstanding/status/pastDue), per-vendor aging,
 * vendor distribution, an outstanding-payables trend, payment metrics, and the paid /
 * outstanding / overdue breakdown. Overdue/due-soon are measured against today.
 */
exports.findAccountsPayable = asyncHandler(async (p) => {
    const { from, to } = p;
    const where = { ...ownerWhere(p), isActive: true };
    if (from && to) where.billDate = { [Op.between]: [from, to] };
    else if (to) where.billDate = { [Op.lte]: to };
    else if (from) where.billDate = { [Op.gte]: from };

    const rows = await vendorBill.findAll({
        where,
        attributes: ["vendor", "billNo", "billDate", "dueDate", "amount", "paid", "paidDate"],
        order: [["billDate", "ASC"]],
        raw: true,
    });

    return assembleAccountsPayable({ from, to, bills: rows, today: Date.now() });
});

// Exposed for unit tests — pure derivation (no DB); `today` injected.
exports._assembleAccountsPayable = assembleAccountsPayable;
