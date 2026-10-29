import { saveAs } from 'file-saver';

import { InsightsTabKey } from './insightsDashboardData';
import { monthLabel } from './reportFormat';
import { AccountingInsights, AccountsReceivable, BusinessHealth } from '../api/reports';

type Cell = string | number;
type Row = Cell[];

export interface InsightsExportContext {
    financialYear: string;
    insights: AccountingInsights;
    ar: AccountsReceivable | null;
    health: BusinessHealth | null;
}

const TAB_LABEL: Record<InsightsTabKey, string> = {
    overview: 'Overview',
    revenue: 'Revenue',
    expense: 'Expense',
    profitability: 'Profitability',
    'cash-flow': 'Cash Flow',
    'tax-gst': 'Tax & GST',
    'working-capital': 'Working Capital',
};

const num = (n: number): number => Number(n) || 0;
const marginPct = (income: number, net: number): number =>
    income > 0 ? Number(((net / income) * 100).toFixed(1)) : 0;

const totalsBlock = (insights: AccountingInsights): Row[] => {
    const { income, expense, net } = insights.totals;
    return [
        ['Metric', 'Value'],
        ['Total Revenue', num(income)],
        ['Total Expenses', num(expense)],
        ['Net Profit', num(net)],
        ['Net Margin (%)', marginPct(income, net)],
    ];
};

type MonthlyColumns = 'all' | 'revenue' | 'expense' | 'profit';

const monthlyBlock = (insights: AccountingInsights, columns: MonthlyColumns): Row[] => {
    const months = insights.monthly ?? [];
    if (columns === 'revenue') {
        return [['Month', 'Revenue'], ...months.map(m => [monthLabel(m.month), num(m.income)])];
    }
    if (columns === 'expense') {
        return [['Month', 'Expense'], ...months.map(m => [monthLabel(m.month), num(m.expense)])];
    }
    if (columns === 'profit') {
        return [
            ['Month', 'Revenue', 'Net Profit', 'Net Margin (%)'],
            ...months.map(m => {
                const net = num(m.income) - num(m.expense);
                return [monthLabel(m.month), num(m.income), net, marginPct(num(m.income), net)];
            }),
        ];
    }
    return [
        ['Month', 'Revenue', 'Expense', 'Net Profit'],
        ...months.map(m => [
            monthLabel(m.month),
            num(m.income),
            num(m.expense),
            num(m.income) - num(m.expense),
        ]),
    ];
};

const categoryBlock = (header: string, list: { category: string; total: number }[]): Row[] => [
    [header, 'Amount'],
    ...list.map(c => [c.category || 'Uncategorized', num(c.total)]),
];

const partyBlock = (header: string, list: { party: string; total: number }[]): Row[] => [
    [header, 'Amount'],
    ...list.map(p => [p.party || 'Unknown', num(p.total)]),
];

const blocksForTab = (tab: InsightsTabKey, ctx: InsightsExportContext): Row[][] => {
    const { insights, ar, health } = ctx;
    switch (tab) {
        case 'revenue':
            return [
                monthlyBlock(insights, 'revenue'),
                categoryBlock('Revenue Category', insights.byCategory.income),
                partyBlock('Top Customers', insights.topParties.income),
            ];
        case 'expense':
            return [
                monthlyBlock(insights, 'expense'),
                categoryBlock('Expense Category', insights.byCategory.expense),
                partyBlock('Top Vendors', insights.topParties.expense),
            ];
        case 'profitability':
            return [monthlyBlock(insights, 'profit'), totalsBlock(insights)];
        case 'overview': {
            const summary = totalsBlock(insights);
            if (ar) summary.push(['AR Outstanding', num(ar.totals.outstanding)]);
            if (health) summary.push(['Business Health Score', health.score]);
            return [summary, monthlyBlock(insights, 'all')];
        }
        default:
            // Tabs not yet wired to real data fall back to the financial summary.
            return [totalsBlock(insights), monthlyBlock(insights, 'all')];
    }
};

const escapeCell = (c: Cell): string => `"${String(c ?? '').replace(/"/g, '""')}"`;
const toLine = (row: Row): string => row.map(escapeCell).join(',');

// UTF-8 byte-order mark so Excel renders the content (₹/unicode) correctly.
const BOM = '\uFEFF';

// Builds and downloads a CSV of the active Insights tab's real data (FY-scoped). Returns false
// when there is nothing to export yet (data still loading / unavailable).
export const downloadInsightsCsv = (tab: InsightsTabKey, ctx: InsightsExportContext): boolean => {
    if (!ctx.insights) return false;
    const label = TAB_LABEL[tab];
    const blocks = blocksForTab(tab, ctx);

    const lines: string[] = [toLine([`Insights - ${label}`, ctx.financialYear]), ''];
    blocks.forEach((block, i) => {
        block.forEach(row => lines.push(toLine(row)));
        if (i < blocks.length - 1) lines.push('');
    });

    const blob = new Blob([BOM + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Insights - ${label} - ${ctx.financialYear}.csv`);
    return true;
};
