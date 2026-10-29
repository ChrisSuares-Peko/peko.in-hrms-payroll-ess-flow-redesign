import { DonutBreakdownData, RankedBarListData, TrendChartData } from './insightsDashboardData';
import {
    formatCompact,
    monthLabel,
    niceTicks,
    quarterlyTrend,
    reportColor,
    toLakhs,
} from './reportFormat';
import { AccountingInsights } from '../api/reports';

const REVENUE_COLOR = '#43B75D';
const TOP_STREAMS = 8;

const pct1 = (value: number, total: number): number =>
    total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

export const toRevenueView = (insights: AccountingInsights) => {
    const { income } = insights.totals;
    const monthly = insights.monthly ?? [];

    const trend: TrendChartData = {
        title: 'Revenue Trend',
        subtitle: 'Total revenue by period',
        ticks: niceTicks(monthly.reduce((mx, m) => Math.max(mx, toLakhs(m.income)), 0)),
        color: REVENUE_COLOR,
        monthly: monthly.map(m => ({ period: monthLabel(m.month), value: toLakhs(m.income) })),
        quarterly: quarterlyTrend(monthly, 'income').map(d => ({
            period: d.label,
            value: d.value,
        })),
    };

    // Revenue streams (donut): income by category, sorted desc by the backend. Cap at the top N
    // and fold the remainder into "Other" so the legend stays readable and percentages sum to 100.
    const categories = insights.byCategory.income;
    const head = categories.slice(0, TOP_STREAMS);
    const restTotal = categories.slice(TOP_STREAMS).reduce((sum, c) => sum + c.total, 0);
    const segmentSource =
        restTotal > 0 ? [...head, { category: 'Other', total: restTotal, count: 0 }] : head;

    const streams: DonutBreakdownData = {
        title: 'Revenue Streams',
        subtitle: 'Revenue by stream',
        totalLabel: 'Total Value',
        totalValue: formatCompact(income),
        segments: segmentSource.map((c, i) => ({
            key: c.category || `category-${i}`,
            label: c.category || 'Uncategorized',
            value: formatCompact(c.total),
            percent: pct1(c.total, income),
            color: reportColor(i),
        })),
    };

    // Top customers: highest income counterparties (transaction description is our customer proxy),
    // bars scaled relative to the leader — matching the existing design.
    const parties = insights.topParties.income;
    const leader = parties.length ? parties[0].total : 0;

    const topCustomers: RankedBarListData = {
        title: 'Top Customers',
        subtitle: 'By revenue contribution',
        items: parties.map((p, i) => ({
            key: `customer-${i}`,
            name: p.party || 'Unknown',
            value: formatCompact(p.total),
            percent: leader > 0 ? Math.round((p.total / leader) * 100) : 0,
            color: reportColor(i),
        })),
    };

    return { trend, streams, topCustomers };
};

export type RevenueView = ReturnType<typeof toRevenueView>;
