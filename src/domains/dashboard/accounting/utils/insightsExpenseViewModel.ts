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

const EXPENSE_COLOR = '#FF4F4F';
const TOP_CATEGORIES = 8;

const pct1 = (value: number, total: number): number =>
    total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

export const toExpenseView = (insights: AccountingInsights) => {
    const { expense } = insights.totals;
    const monthly = insights.monthly ?? [];

    const trend: TrendChartData = {
        title: 'Expense Trend',
        subtitle: 'Total spend by period',
        ticks: niceTicks(monthly.reduce((mx, m) => Math.max(mx, toLakhs(m.expense)), 0)),
        color: EXPENSE_COLOR,
        monthly: monthly.map(m => ({ period: monthLabel(m.month), value: toLakhs(m.expense) })),
        quarterly: quarterlyTrend(monthly, 'expense').map(d => ({
            period: d.label,
            value: d.value,
        })),
    };

    // Category breakdown (donut): expenses by category, top N + folded "Other" so % sum to 100.
    const categoryList = insights.byCategory.expense;
    const head = categoryList.slice(0, TOP_CATEGORIES);
    const restTotal = categoryList.slice(TOP_CATEGORIES).reduce((sum, c) => sum + c.total, 0);
    const segmentSource =
        restTotal > 0 ? [...head, { category: 'Other', total: restTotal, count: 0 }] : head;

    const categories: DonutBreakdownData = {
        title: 'Category Breakdown',
        subtitle: 'Expenses by type',
        totalLabel: 'Total Value',
        totalValue: formatCompact(expense),
        segments: segmentSource.map((c, i) => ({
            key: c.category || `category-${i}`,
            label: c.category || 'Uncategorized',
            value: formatCompact(c.total),
            percent: pct1(c.total, expense),
            color: reportColor(i),
        })),
    };

    // Top vendors: highest expense counterparties (transaction description is our vendor proxy),
    // bars scaled relative to the leader.
    const parties = insights.topParties.expense;
    const leader = parties.length ? parties[0].total : 0;

    const topVendors: RankedBarListData = {
        title: 'Top Vendors',
        subtitle: 'By annual spend',
        items: parties.map((p, i) => ({
            key: `vendor-${i}`,
            name: p.party || 'Unknown',
            value: formatCompact(p.total),
            percent: leader > 0 ? Math.round((p.total / leader) * 100) : 0,
            color: reportColor(i),
        })),
    };

    return { trend, categories, topVendors };
};

export type ExpenseView = ReturnType<typeof toExpenseView>;
