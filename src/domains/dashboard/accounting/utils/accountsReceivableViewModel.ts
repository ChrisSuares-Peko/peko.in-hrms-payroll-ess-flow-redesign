import dayjs from 'dayjs';

import {
    AgingRow,
    AgingTotals,
    BreakdownSegment,
    CollectionStat,
    DistributionBar,
    Invoice,
    TrendPoint,
} from './accountsReceivableData';
import { formatCompact, monthLabel } from './reportFormat';
import { AccountsReceivable } from '../api/reports';

const fmtDate = (d: string | null): string => (d ? dayjs(d).format('DD MMM YYYY') : '-');
const pct1 = (value: number, total: number): number =>
    total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
const rateTone = (rate: number): CollectionStat['tone'] => {
    if (rate >= 70) return 'success';
    if (rate >= 40) return 'warning';
    return 'danger';
};

export const toArView = (d: AccountsReceivable) => {
    const invoicesRows: Invoice[] = d.invoices.map(inv => ({
        customer: inv.customer,
        issuedLabel: fmtDate(inv.invoiceDate),
        invoiceNo: inv.invoiceNo,
        invoiceDate: fmtDate(inv.invoiceDate),
        dueDate: fmtDate(inv.dueDate),
        amount: inv.amount,
        paid: inv.paid,
        outstanding: inv.outstanding,
        status: inv.status,
        pastDue: inv.pastDue,
    }));

    const agingRows: AgingRow[] = d.aging.rows;
    const agingTotals: AgingTotals = d.aging.totals;

    const maxDist = Math.max(...d.distribution.map(x => x.amount), 1);
    const distribution: DistributionBar[] = d.distribution.map(x => ({
        customer: x.customer,
        amount: x.amount,
        display: formatCompact(x.amount),
        pct: pct1(x.amount, maxDist),
        tone: x.tone,
    }));

    const trend: TrendPoint[] = d.trend.map(t => ({
        month: monthLabel(t.month),
        value: Number((t.value / 100000).toFixed(1)),
    }));

    const { collectionRate, avgDaysOutstanding, overdueAmount, upcomingAmount } = d.collection;
    const stats: CollectionStat[] = [
        {
            key: 'rate',
            label: 'Collection Rate',
            value: `${collectionRate.toFixed(1)}%`,
            caption: 'of total invoiced',
            tone: rateTone(collectionRate),
        },
        {
            key: 'avg-days',
            label: 'Avg Days Outstanding',
            value: `${avgDaysOutstanding} days`,
            caption: 'average collection period',
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
            key: 'upcoming',
            label: 'Upcoming (30 Days)',
            value: formatCompact(upcomingAmount),
            caption: 'due within 30 days',
            tone: 'success',
        },
    ];

    const total = d.totals.amount;
    const segments: BreakdownSegment[] = [
        {
            label: 'Collected',
            amount: d.breakdown.collected,
            pct: pct1(d.breakdown.collected, total),
            tone: 'success',
        },
        {
            label: 'Outstanding',
            amount: d.breakdown.outstanding,
            pct: pct1(d.breakdown.outstanding, total),
            tone: 'warning',
        },
        {
            label: 'Overdue',
            amount: d.breakdown.overdue,
            pct: pct1(d.breakdown.overdue, total),
            tone: 'danger',
        },
    ];

    return {
        invoicesRows,
        aging: {
            rows: agingRows,
            totals: agingTotals,
            outstandingTag: `${formatCompact(d.totals.outstanding)} outstanding`,
        },
        trend,
        distribution,
        collection: { stats, segments, total },
    };
};

export type ArView = ReturnType<typeof toArView>;
