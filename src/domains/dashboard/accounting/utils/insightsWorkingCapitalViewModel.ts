import { AGING_COLORS, AgingData, Tone, WcMetric } from './insightsDashboardData';
import { formatCompact, formatRupee } from './reportFormat';
import { WorkingCapital, WorkingCapitalAging } from '../api/reports';

const days = (value: number | null): string => (value === null ? '—' : String(Math.round(value)));

// Negative CCC (customers pay before suppliers are due) is the good case.
const cccTone = (ccc: number | null): Tone => {
    if (ccc === null) return 'muted';
    return ccc <= 0 ? 'success' : 'warning';
};

const toAging = (
    title: string,
    totalOutstanding: number,
    aging: WorkingCapitalAging
): AgingData => {
    const buckets = [
        { key: '0-30', label: '0–30 days', amount: aging.d0_30, color: AGING_COLORS.current },
        { key: '31-60', label: '31–60 days', amount: aging.d31_60, color: AGING_COLORS.warning },
        { key: '61-90', label: '61–90 days', amount: aging.d61_90, color: AGING_COLORS.overdue },
        { key: '90+', label: '90+ days', amount: aging.d90, color: AGING_COLORS.severe },
    ];
    const sum = buckets.reduce((total, b) => total + b.amount, 0);

    return {
        title,
        subtitle: `Total outstanding: ${formatRupee(totalOutstanding)}`,
        totalShort: formatCompact(totalOutstanding),
        buckets: buckets.map(b => ({
            key: b.key,
            label: b.label,
            percent: sum > 0 ? Number(((b.amount / sum) * 100).toFixed(1)) : 0,
            value: formatCompact(b.amount),
            color: b.color,
        })),
    };
};

export const toWorkingCapitalView = (wc: WorkingCapital) => {
    const { dso, dpo, ccc } = wc.metrics;

    const metrics: WcMetric[] = [
        {
            key: 'dso',
            label: 'DSO',
            value: days(dso),
            unit: 'days',
            tone: dso === null ? 'muted' : 'ink',
            title: 'Days Sales Outstanding',
            sub: 'Avg. time to collect receivables',
        },
        {
            key: 'dpo',
            label: 'DPO',
            value: days(dpo),
            unit: 'days',
            tone: dpo === null ? 'muted' : 'ink',
            title: 'Days Payable Outstanding',
            sub: 'Avg. time to pay vendors',
        },
        {
            key: 'ccc',
            label: 'CCC',
            value: days(ccc),
            unit: 'days',
            tone: cccTone(ccc),
            title: 'Cash Conversion Cycle',
            sub: 'DSO − DPO (lower is better)',
        },
    ];

    return {
        metrics,
        arAging: toAging(
            'Accounts Receivable Aging',
            wc.receivables.totalOutstanding,
            wc.receivables.aging
        ),
        apAging: toAging('Accounts Payable Aging', wc.payables.totalOutstanding, wc.payables.aging),
    };
};
