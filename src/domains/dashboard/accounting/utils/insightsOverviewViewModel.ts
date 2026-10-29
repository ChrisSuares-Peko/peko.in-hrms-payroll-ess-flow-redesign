import dayjs from 'dayjs';

import { BarLineChartData, dashboardColors, KpiCardItem, Tone } from './insightsDashboardData';
import { formatCompact, monthLabel, niceTicks, signedCompact, toLakhs } from './reportFormat';
import {
    AccountingInsights,
    AccountsPayable,
    AccountsReceivable,
    CashFlowOverview,
    ReportSummary,
} from '../api/reports';

// Net margin as a percentage of income, to one decimal. Guards zero/negative income
// (returns 0 instead of NaN/Infinity) while still allowing a negative result.
const pctOfIncome = (part: number, income: number): number =>
    income > 0 ? Number(((part / income) * 100).toFixed(1)) : 0;

const periodLabel = (period: AccountingInsights['period']): string => {
    if (!period.from || !period.to) return 'Selected period';
    return `${dayjs(period.from).format('MMM YYYY')} – ${dayjs(period.to).format('MMM YYYY')}`;
};

// Shown while the prior-period figures are still loading, or when no prior baseline exists.
const pendingYoyTail: KpiCardItem['tail'] = { text: '— YoY', tone: 'muted', arrow: false };

const changeTone = (isZero: boolean, favorable: boolean): Tone => {
    if (isZero) return 'muted';
    return favorable ? 'success' : 'danger';
};

// Year-over-year change tail computed from the prior equivalent period. `favorableWhenUp` drives
// the colour (revenue up = good/green; expenses up = bad/red). KpiCard only has an up-caret, so the
// arrow shows only on an increase; the sign + colour convey direction for a decrease.
const deltaTail = (
    current: number,
    prior: number | null,
    favorableWhenUp: boolean
): KpiCardItem['tail'] => {
    if (prior === null) return pendingYoyTail; // prior period still loading / unavailable
    if (prior === 0) return undefined; // no prior-year baseline to compare against
    const change = ((current - prior) / Math.abs(prior)) * 100;
    const up = change > 0;
    return {
        text: `${up ? '+' : ''}${change.toFixed(0)}% YoY`,
        tone: changeTone(change === 0, up === favorableWhenUp),
        arrow: up,
    };
};

// Margins are percentages, so their YoY movement is in percentage points (pp), not a % change.
const marginDeltaTail = (
    currentMargin: number,
    prior: ReportSummary | null
): KpiCardItem['tail'] => {
    if (prior === null) return pendingYoyTail;
    if (prior.totals.income <= 0) return undefined; // no prior income → no prior margin to compare
    const priorMargin = (prior.totals.net / prior.totals.income) * 100;
    const pp = currentMargin - priorMargin;
    const up = pp > 0;
    return {
        text: `${up ? '+' : ''}${pp.toFixed(1)}pp YoY`,
        tone: changeTone(pp === 0, up),
        arrow: up,
    };
};

export const toOverviewView = (
    insights: AccountingInsights,
    ar: AccountsReceivable | null,
    prior: ReportSummary | null,
    cashFlow: CashFlowOverview | null,
    ap: AccountsPayable | null
) => {
    const { income, expense, net } = insights.totals;
    const margin = pctOfIncome(net, income);
    const rangeLabel = periodLabel(insights.period);
    const priorTotals = prior ? prior.totals : null;

    // Closing cash balance for the period, with the backend's own prior-period % change.
    const closing = cashFlow ? cashFlow.summary.closingBalance : null;
    const cashBalanceKpi: KpiCardItem = {
        key: 'cash-balance',
        label: 'Cash Balance',
        value: closing ? signedCompact(closing.value) : '₹0',
        valueTone: closing && closing.value < 0 ? 'danger' : undefined,
        sub:
            closing && cashFlow
                ? `as of ${dayjs(cashFlow.range.to).format('MMM YYYY')}`
                : rangeLabel,
        tail:
            closing && closing.deltaPercent !== null
                ? {
                      text: `${closing.up ? '+' : ''}${closing.deltaPercent.toFixed(0)}% YoY`,
                      tone: changeTone(closing.deltaPercent === 0, closing.up),
                      arrow: closing.up,
                  }
                : pendingYoyTail,
    };

    const primaryKpis: KpiCardItem[] = [
        {
            key: 'revenue',
            label: 'Total Revenue',
            value: formatCompact(income),
            sub: rangeLabel,
            tail: deltaTail(income, priorTotals ? priorTotals.income : null, true),
        },
        {
            key: 'expenses',
            label: 'Total Expenses',
            value: formatCompact(expense),
            sub: rangeLabel,
            tail: deltaTail(expense, priorTotals ? priorTotals.expense : null, false),
        },
        {
            key: 'net-profit',
            label: 'Net Profit',
            value: signedCompact(net),
            valueTone: net >= 0 ? 'success' : 'danger',
            sub: `${margin}% net margin`,
            tail: deltaTail(net, priorTotals ? priorTotals.net : null, true),
        },
        cashBalanceKpi,
    ];

    const arOutstanding = ar ? ar.totals.outstanding : 0;
    const arOverdue = ar ? ar.collection.overdueAmount : 0;
    const arOverduePct = arOutstanding > 0 ? ((arOverdue / arOutstanding) * 100).toFixed(1) : '0';

    // Falls back to zeros when the payables data is unavailable.
    const apOutstanding = ap ? ap.breakdown.outstanding : 0;
    const apOverdue = ap ? ap.payment.overdueAmount : 0;
    const apOverduePct = apOutstanding > 0 ? ((apOverdue / apOutstanding) * 100).toFixed(1) : '0';
    const apOutstandingKpi: KpiCardItem = {
        key: 'ap-outstanding',
        label: 'AP Outstanding',
        value: formatCompact(apOutstanding),
        valueTone: 'warning',
        sub: `${apOverduePct}% overdue`,
        tail: { text: `${formatCompact(apOverdue)} past due`, tone: 'warning' },
    };

    const secondaryKpis: KpiCardItem[] = [
        {
            key: 'net-margin',
            label: 'Net Margin',
            value: `${margin}%`,
            valueTone: margin >= 0 ? 'success' : 'danger',
            sub: 'Target 20%',
            tail: marginDeltaTail(margin, prior),
        },
        ar
            ? {
                  key: 'ar-outstanding',
                  label: 'AR Outstanding',
                  value: formatCompact(arOutstanding),
                  valueTone: 'danger',
                  sub: `${arOverduePct}% overdue`,
                  tail: { text: `${formatCompact(arOverdue)} at risk`, tone: 'danger' },
              }
            : {
                  key: 'ar-outstanding',
                  label: 'AR Outstanding',
                  value: '—',
                  valueTone: 'muted',
                  sub: 'Receivables data unavailable',
              },
        apOutstandingKpi,
    ];

    const points: BarLineChartData['points'] = (insights.monthly ?? []).map(m => ({
        month: monthLabel(m.month),
        revenue: toLakhs(m.income),
        expense: toLakhs(m.expense),
        profit: toLakhs(m.income - m.expense),
    }));
    const peak = (insights.monthly ?? []).reduce(
        (max, m) => Math.max(max, toLakhs(m.income), toLakhs(m.expense)),
        0
    );

    const revenueVsExpenses: BarLineChartData = {
        title: 'Revenue vs Expenses',
        subtitle: 'Monthly revenue and expenses with net profit trend',
        ticks: niceTicks(peak),
        xKey: 'month',
        bars: [
            { dataKey: 'revenue', color: dashboardColors.revenueBar },
            { dataKey: 'expense', color: dashboardColors.expenseBar },
        ],
        line: { dataKey: 'profit', color: dashboardColors.netProfitLine },
        points,
    };

    return { primaryKpis, secondaryKpis, revenueVsExpenses };
};

export type OverviewView = ReturnType<typeof toOverviewView>;
