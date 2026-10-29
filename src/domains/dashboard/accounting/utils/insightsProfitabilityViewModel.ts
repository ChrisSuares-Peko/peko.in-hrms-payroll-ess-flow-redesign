import { MonthlyBarChartData, PnlSummaryData, ProfitTrendData } from './insightsDashboardData';
import { formatCompact, monthLabel, niceTicks, signedCompact, toLakhs } from './reportFormat';
import { AccountingInsights } from '../api/reports';

const MARGIN_COLOR = '#F59E0B';

const pct1 = (value: number, total: number): number =>
    total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

export const toProfitabilityView = (insights: AccountingInsights) => {
    const { income, expense, net } = insights.totals;
    const monthly = insights.monthly ?? [];
    const margin = pct1(net, income);

    // Profit trend: the "gross" series carries Revenue and "net" carries Net Profit. A true gross
    // profit (revenue − COGS) needs a COGS classification the cash ledger doesn't capture, so the
    // chart's green line is relabeled "Revenue".
    const profitTrend: ProfitTrendData = {
        title: 'Profit Trend',
        subtitle: 'Gross Profit vs Net Profit monthly',
        ticks: niceTicks(monthly.reduce((mx, m) => Math.max(mx, toLakhs(m.income)), 0)),
        points: monthly.map(m => ({
            month: monthLabel(m.month),
            gross: toLakhs(m.income),
            net: toLakhs(m.income - m.expense),
        })),
    };

    // Net margin (%) per month. Loss months (expense > income) go negative and clip at the 0 floor.
    const marginPoints = monthly.map(m => ({
        month: monthLabel(m.month),
        value: pct1(m.income - m.expense, m.income),
    }));
    const netMargin: MonthlyBarChartData = {
        title: 'Net Margin by Month',
        subtitle: '% margin trend',
        unit: 'percent',
        color: MARGIN_COLOR,
        ticks: niceTicks(marginPoints.reduce((mx, p) => Math.max(mx, p.value), 0)),
        points: marginPoints,
    };

    // P&L summary — real cash-ledger figures. A gross-profit / operating-expense split needs a
    // COGS vs opex classification we don't track, so those (estimated) rows are omitted.
    const pnl: PnlSummaryData = {
        title: 'P&L Summary',
        subtitle: 'Selected period',
        rows: [
            { label: 'Total Revenue', value: formatCompact(income), tone: 'success' },
            { label: 'Less: Total Expenses', value: `(${formatCompact(expense)})`, tone: 'danger' },
        ],
        total: {
            label: 'Net Profit',
            value: signedCompact(net),
            tone: net >= 0 ? 'success' : 'danger',
        },
        footer: { label: 'Net Margin', value: `${margin}%` },
    };

    return { profitTrend, netMargin, pnl };
};

export type ProfitabilityView = ReturnType<typeof toProfitabilityView>;
