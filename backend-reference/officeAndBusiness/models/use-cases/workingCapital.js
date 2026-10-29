const asyncHandler = require("../../middlewares/async");
const { findAccountsReceivable } = require("./accountsReceivable");
const { findAccountsPayable } = require("./accountsPayable");

const num = (v) => Number(v) || 0;
const round0 = (v) => Math.round(num(v));
const DAY = 24 * 60 * 60 * 1000;

// AR already returns aggregated aging totals; AP only exposes per-vendor rows, so sum
// those into the same {d0_30, d31_60, d61_90, d90} shape.
const sumAging = (rows) =>
    rows.reduce(
        (acc, r) => ({
            d0_30: acc.d0_30 + num(r.d0_30),
            d31_60: acc.d31_60 + num(r.d31_60),
            d61_90: acc.d61_90 + num(r.d61_90),
            d90: acc.d90 + num(r.d90),
        }),
        { d0_30: 0, d31_60: 0, d61_90: 0, d90: 0 }
    );

// Pure assembly (no DB) from already-fetched AR/AP report data — unit-testable.
// DSO/DPO scale the current outstanding balance by (period length / period turnover),
// the standard "days of sales/purchases outstanding" formula. CCC = DSO - DPO: this
// ledger has no inventory tracking, so there's no DIO leg to add.
const assembleWorkingCapital = ({ from, to, ar, ap }) => {
    const daysInPeriod =
        from && to ? Math.max(1, Math.round((new Date(to) - new Date(from)) / DAY) + 1) : null;

    const receivablesOutstanding = round0(ar.totals.outstanding);
    const payablesOutstanding = round0(ap.breakdown.outstanding + ap.breakdown.overdue);
    const payablesBilled = round0(ap.breakdown.paid + ap.breakdown.outstanding + ap.breakdown.overdue);

    const dso =
        daysInPeriod && ar.totals.amount > 0
            ? Math.round((ar.totals.outstanding / ar.totals.amount) * daysInPeriod)
            : 0;
    const dpo =
        daysInPeriod && payablesBilled > 0
            ? Math.round((payablesOutstanding / payablesBilled) * daysInPeriod)
            : 0;

    return {
        range: { from: from || null, to: to || null },
        metrics: { dso, dpo, ccc: dso - dpo },
        receivables: {
            totalOutstanding: receivablesOutstanding,
            aging: {
                d0_30: round0(ar.aging.totals.d0_30),
                d31_60: round0(ar.aging.totals.d31_60),
                d61_90: round0(ar.aging.totals.d61_90),
                d90: round0(ar.aging.totals.d90),
            },
        },
        payables: {
            totalOutstanding: payablesOutstanding,
            aging: sumAging(ap.aging.rows),
        },
    };
};

/**
 * Working Capital: DSO, DPO and the Cash Conversion Cycle, plus the receivables/payables
 * outstanding totals and aging buckets that back them. Reuses findAccountsReceivable /
 * findAccountsPayable so these figures always match their own report pages.
 */
exports.findWorkingCapital = asyncHandler(async (p) => {
    const { from, to } = p;
    const [ar, ap] = await Promise.all([
        findAccountsReceivable({ corporateUserId: p.corporateUserId, from, to }),
        findAccountsPayable({
            corporateUserId: p.corporateUserId,
            subCorporateUserId: p.subCorporateUserId,
            from,
            to,
        }),
    ]);
    return assembleWorkingCapital({ from, to, ar, ap });
});

// Exposed for unit tests — pure metrics/aging assembly (no DB).
exports._assembleWorkingCapital = assembleWorkingCapital;
