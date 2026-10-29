import dayjs from 'dayjs';

import {
    AgingTotals,
    Bill,
    BreakdownSegment,
    DistributionBar,
    PaymentStat,
    StatTone,
    TrendPoint,
} from './accountsPayableData';
import { formatCompact, monthLabel } from './reportFormat';
import { AccountsPayable } from '../api/reports';

const fmtDate = (d: string | null): string => (d ? dayjs(d).format('DD MMM YYYY') : '-');

const pct1 = (value: number, total: number): number =>
    total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

const rateTone = (rate: number): StatTone => {
    if (rate >= 70) return 'success';
    if (rate >= 40) return 'warning';
    return 'danger';
};

export const toApView = (d: AccountsPayable) => {
    const billsRows: Bill[] = d.bills.map(b => ({
        vendor: b.vendor,
        issuedLabel: fmtDate(b.billDate),
        billNo: b.billNo,
        billDate: fmtDate(b.billDate),
        dueDate: fmtDate(b.dueDate),
        amount: b.amount,
        paid: b.paid,
        outstanding: b.outstanding,
        status: b.status,
        pastDue: b.pastDue,
    }));

    const agingTotals: AgingTotals = d.aging.rows.reduce<AgingTotals>(
        (acc, row) => ({
            d0_30: acc.d0_30 + row.d0_30,
            d31_60: acc.d31_60 + row.d31_60,
            d61_90: acc.d61_90 + row.d61_90,
            d90: acc.d90 + row.d90,
        }),
        { d0_30: 0, d31_60: 0, d61_90: 0, d90: 0 }
    );
    const agingGrandTotal =
        agingTotals.d0_30 + agingTotals.d31_60 + agingTotals.d61_90 + agingTotals.d90;

    const maxDist = Math.max(...d.distribution.map(x => x.amount), 1);
    const distribution: DistributionBar[] = d.distribution.map(x => ({
        vendor: x.vendor,
        amount: x.amount,
        display: formatCompact(x.amount),
        pct: pct1(x.amount, maxDist),
        tone: x.tone,
    }));

    const trend: TrendPoint[] = d.trend.map(t => ({
        month: monthLabel(t.month),
        value: Number((t.value / 100000).toFixed(1)),
    }));

    const { paymentRate, avgDaysPayable, overdueAmount, dueSoonAmount } = d.payment;
    const stats: PaymentStat[] = [
        {
            key: 'rate',
            label: 'Payment Rate',
            value: `${paymentRate.toFixed(1)}%`,
            caption: 'of total billed',
            tone: rateTone(paymentRate),
        },
        {
            key: 'avg-days',
            label: 'Avg Days Payable',
            value: `${avgDaysPayable} days`,
            caption: 'average payment period',
            tone: 'warning',
        },
        {
            key: 'overdue',
            label: 'Overdue Amount',
            value: formatCompact(overdueAmount),
            caption: 'past due date',
            tone: 'danger',
        },
        {
            key: 'due',
            label: 'Due (30 Days)',
            value: formatCompact(dueSoonAmount),
            caption: 'due within 30 days',
            tone: 'success',
        },
    ];

    const breakdownTotal = d.breakdown.paid + d.breakdown.outstanding + d.breakdown.overdue;
    const segments: BreakdownSegment[] = [
        {
            label: 'Paid',
            amount: d.breakdown.paid,
            pct: pct1(d.breakdown.paid, breakdownTotal),
            tone: 'success',
        },
        {
            label: 'Outstanding',
            amount: d.breakdown.outstanding,
            pct: pct1(d.breakdown.outstanding, breakdownTotal),
            tone: 'warning',
        },
        {
            label: 'Overdue',
            amount: d.breakdown.overdue,
            pct: pct1(d.breakdown.overdue, breakdownTotal),
            tone: 'danger',
        },
    ];

    return {
        billsRows,
        aging: {
            rows: d.aging.rows,
            totals: agingTotals,
            outstandingTag: `${formatCompact(agingGrandTotal)} outstanding`,
        },
        trend,
        distribution,
        payment: { stats, segments, total: breakdownTotal },
    };
};
