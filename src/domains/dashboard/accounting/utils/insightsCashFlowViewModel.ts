import dayjs from 'dayjs';

import {
    CashFlowItem,
    CashFlowSummaryData,
    TrendChartData,
    TrendPoint,
} from './insightsDashboardData';
import { monthLabel, niceTicks, quarterlySeries, signedCompact, toLakhs } from './reportFormat';
import { CashFlowOverview, FreeCashFlow } from '../api/reports';

const BALANCE_COLOR = '#F59E0B';
const FCF_COLOR = '#3B82F6';

const toTrendPoints = (series: { label: string; value: number }[]): TrendPoint[] =>
    series.map(d => ({ period: d.label, value: d.value }));

const peakLakhs = (values: number[]): number =>
    values.reduce((mx, v) => Math.max(mx, toLakhs(v)), 0);

const rangeLabel = (range: { from: string; to: string }): string =>
    `${dayjs(range.from).format('MMM YYYY')} – ${dayjs(range.to).format('MMM YYYY')}`;

const flowItem = (key: string, label: string, value: number, signed: boolean): CashFlowItem => {
    if (value === 0) return { key, label, value: '₹0', tone: 'neutral' };
    const text = signedCompact(value);
    return {
        key,
        label,
        value: signed && value > 0 ? `+${text}` : text,
        tone: value > 0 ? 'positive' : 'negative',
    };
};

export const toCashBalanceView = (overview: CashFlowOverview) => {
    const balances = (overview.balanceProgression ?? []).map(b => ({
        month: b.month,
        value: b.balance,
    }));

    const balanceTrend: TrendChartData = {
        title: 'Cash Balance Trend',
        subtitle: `Cumulative cash position ${rangeLabel(overview.range)}`,
        ticks: niceTicks(peakLakhs(balances.map(b => b.value))),
        color: BALANCE_COLOR,
        monthly: balances.map(b => ({ period: monthLabel(b.month), value: toLakhs(b.value) })),
        quarterly: toTrendPoints(quarterlySeries(balances, 'last')),
    };

    const { operating, investing, financing } = overview.summary;
    const summary: CashFlowSummaryData = {
        title: 'Cash Flow Summary',
        subtitle: 'Operating, Investing & Financing',
        items: [
            flowItem('operating', 'Operating Cash Flow', operating.value, true),
            flowItem('investing', 'Investing Activities', investing.value, true),
            flowItem('financing', 'Financing Activities', financing.value, true),
        ],
    };

    return { balanceTrend, summary };
};

export const toFreeCashFlowTrend = (fcf: FreeCashFlow): TrendChartData => {
    const points = (fcf.trend ?? []).map(t => ({ month: t.month, value: t.freeCashFlow }));
    return {
        title: 'Free Cash Flow Trend',
        subtitle: 'Operating FCF monthly',
        ticks: niceTicks(peakLakhs(points.map(p => p.value))),
        color: FCF_COLOR,
        monthly: points.map(p => ({ period: monthLabel(p.month), value: toLakhs(p.value) })),
        quarterly: toTrendPoints(quarterlySeries(points, 'sum')),
    };
};
