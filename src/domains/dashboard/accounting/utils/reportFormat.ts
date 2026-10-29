import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { ReportMonth } from '../api/reports';

export const REPORT_PALETTE = [
    '#FF4F4F',
    '#3B82F6',
    '#F59E0B',
    '#10B981',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
    '#6366F1',
    '#84CC16',
];

export const reportColor = (index: number): string => REPORT_PALETTE[index % REPORT_PALETTE.length];

export const formatRupee = (n: number): string => `₹${formatNumberWithLocalString(n || 0)}`;

export const formatCompact = (n: number): string => {
    const v = n || 0;
    if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
    if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
    if (v >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
    return `₹${v.toFixed(2)}`;
};

// formatCompact only handles non-negative amounts; keep the sign for losses (e.g. "-₹1.5L").
export const signedCompact = (n: number): string =>
    n < 0 ? `-${formatCompact(Math.abs(n))}` : formatCompact(n);

export const toLakhs = (n: number): number => Number(((n || 0) / 1e5).toFixed(2));

const NICE_STEPS = [1, 2, 2.5, 5, 10];

// Snap a rough value up to the nearest "nice" number (1/2/2.5/5/10 × 10ⁿ).
const niceStep = (rough: number): number => {
    if (rough <= 0) return 1;
    const base = 10 ** Math.floor(Math.log10(rough));
    return (NICE_STEPS.find(s => s * base >= rough) ?? 10) * base;
};

// Five ascending Y-axis ticks [0..top] (in lakhs) whose top tick is >= `peakLakhs`, so chart
// values never clip. Empty/zero data falls back to [0..4] so the axis still renders.
export const niceTicks = (peakLakhs: number): number[] => {
    if (peakLakhs <= 0) return [0, 1, 2, 3, 4];
    const step = niceStep(peakLakhs / 4);
    return [0, 1, 2, 3, 4].map(i => step * i);
};

export const monthLabel = (ym: string): string => dayjs(`${ym}-01`).format('MMM');

// Upper-cases the first character only — turns raw chart dataKeys like "revenue"/"expenses"
// into "Revenue"/"Expenses" for tooltips without lower-casing multi-word series names.
export const capitalizeFirst = (s: string | number): string => {
    const str = String(s);
    return str.length ? str.charAt(0).toUpperCase() + str.slice(1) : str;
};

// Recharts tooltip value formatter for lakh-denominated charts → "₹0.42L".
export const lakhTooltip = (value: number): string => `₹${value}L`;

export const pctOf = (value: number, total: number): number =>
    total > 0 ? Math.round((value / total) * 100) : 0;

// Formats a percentage number to at most 1 decimal, dropping a trailing ".0"
// (e.g. 43.2 -> "43.2%", 50 -> "50%").
export const formatPct = (n: number): string => `${parseFloat((n || 0).toFixed(1))}%`;

export interface TrendDatum {
    label: string;
    value: number;
}

export const monthlyTrend = (months: ReportMonth[], key: 'income' | 'expense'): TrendDatum[] =>
    months.map(m => ({ label: monthLabel(m.month), value: toLakhs(m[key]) }));

export const fiscalQuarterLabel = (ym: string): string => {
    const [year, mm] = ym.split('-');
    const month = Number(mm);
    const quarter = month <= 3 ? 4 : Math.ceil((month - 3) / 3);
    const fyStart = month <= 3 ? Number(year) - 1 : Number(year);
    return `Q${quarter} '${String(fyStart).slice(2)}`;
};

export const quarterlyTrend = (months: ReportMonth[], key: 'income' | 'expense'): TrendDatum[] => {
    const map = new Map<string, number>();
    months.forEach(m => {
        const q = fiscalQuarterLabel(m.month);
        map.set(q, (map.get(q) || 0) + m[key]);
    });
    return [...map.entries()].map(([label, value]) => ({ label, value: toLakhs(value) }));
};

export interface MonthValue {
    month: string;
    value: number;
}

// Rolls a monthly series up to fiscal quarters (values in lakhs). `sum` adds the months (flows);
// `last` keeps the quarter's final month (balances / point-in-time figures).
export const quarterlySeries = (points: MonthValue[], mode: 'sum' | 'last'): TrendDatum[] => {
    const map = new Map<string, number>();
    points.forEach(p => {
        const q = fiscalQuarterLabel(p.month);
        map.set(q, mode === 'sum' ? (map.get(q) || 0) + p.value : p.value);
    });
    return [...map.entries()].map(([label, value]) => ({ label, value: toLakhs(value) }));
};
