import { AttentionItem, insightColors, SummaryRow } from './insightsData';
import { FINANCIAL_YEARS } from './reportFilters';
import { formatCompact, formatRupee, monthLabel, pctOf } from './reportFormat';
import { AccountingInsights } from '../api/reports';

const signed = (n: number, fmt: (v: number) => string) =>
    `${n >= 0 ? '+' : '-'}${fmt(Math.abs(n))}`;

export const toInsightsView = (d: AccountingInsights) => {
    const { income, expense, net } = d.totals;

    const rows: SummaryRow[] = [
        { label: 'Total in', value: formatRupee(income), tone: 'success' },
        { label: 'Total out', value: formatRupee(expense), tone: 'danger' },
        { label: 'Net', value: signed(net, formatRupee), tone: net >= 0 ? 'success' : 'danger' },
    ];

    const attentionItems: AttentionItem[] = [];
    if (d.attention.needsReview > 0)
        attentionItems.push({
            id: 'review',
            title: `${d.attention.needsReview} need review`,
            subtitle: 'Transactions awaiting review',
            tone: 'warning',
        });
    if (d.attention.uncategorized > 0)
        attentionItems.push({
            id: 'uncategorized',
            title: `${d.attention.uncategorized} uncategorized`,
            subtitle: 'Add a category to include in reports',
            tone: 'danger',
        });
    if (d.attention.recurringCount > 0)
        attentionItems.push({
            id: 'recurring',
            title: `${d.attention.recurringCount} recurring detected`,
            subtitle: 'Rent, subscriptions, salary',
            tone: 'neutral',
        });
    if (attentionItems.length === 0)
        attentionItems.push({
            id: 'clear',
            title: 'All clear',
            subtitle: 'Nothing needs attention',
            tone: 'neutral',
        });

    const sum = income + expense;
    const incomePct = pctOf(income, sum);

    const categorizedCount = d.attention.totalCount - d.attention.uncategorized;
    const categorizedPct = pctOf(categorizedCount, d.attention.totalCount);

    const monthlyNets = d.monthly.map(m => m.income - m.expense);
    const maxAbsNet = Math.max(...monthlyNets.map(Math.abs), 1);

    return {
        monthSummary: { title: `${FINANCIAL_YEARS[0]} Summary`, rows },
        attention: { title: 'Attention required', items: attentionItems },
        incomeExpense: {
            title: 'Income vs Expense split',
            net: signed(net, formatRupee),
            segments: [
                { key: 'income', label: 'Income', percent: incomePct, color: insightColors.income },
                {
                    key: 'expense',
                    label: 'Expense',
                    percent: sum > 0 ? 100 - incomePct : 0,
                    color: insightColors.expense,
                },
            ],
        },
        trend: {
            title: 'Income vs expense trend',
            points: d.monthly.map(m => ({
                label: monthLabel(m.month),
                income: m.income,
                expense: m.expense,
            })),
        },
        topCategories: {
            title: 'Top expense categories',
            items: d.byCategory.expense.slice(0, 5).map(c => ({
                label: c.category,
                value: formatRupee(c.total),
                amount: c.total,
            })),
        },
        categorized: {
            title: 'Categorized health',
            percent: categorizedPct,
            fraction: `${categorizedCount}/${d.attention.totalCount}`,
            detail: 'transactions categorized',
            note: categorizedPct >= 90 ? '' : 'Needs attention',
        },
        sources: {
            title: 'Transaction sources',
            items: d.sources.map(s => ({
                label: s.account,
                value: formatCompact(s.total),
                amount: s.total,
                sublabel: `${s.count} txn${s.count === 1 ? '' : 's'}`,
            })),
        },
        topVendors: {
            title: 'Top vendors by spends',
            items: d.topParties.expense.slice(0, 5).map((p, i) => ({
                id: `${i}-${p.party}`,
                name: p.party,
                value: formatCompact(p.total),
            })),
        },
        recurring: {
            title: 'Recurring expenses',
            monthly: formatRupee(d.recurring.committed),
            monthlyNote: 'Committed (this period)',
            items: d.recurring.items.map((r, i) => ({
                id: `${i}-${r.name}`,
                name: r.name,
                value: formatRupee(r.total),
            })),
            moreLabel: d.recurring.moreCount > 0 ? `+${d.recurring.moreCount} more` : '',
        },
        accounts: {
            title: 'Account breakdown',
            items: d.accounts.map((a, i) => ({
                id: a.id != null ? String(a.id) : `unassigned-${i}`,
                name: a.name,
                inPercent: pctOf(a.inflow, a.inflow + a.outflow),
                inValue: signed(a.inflow, formatCompact),
                outValue: `-${formatCompact(a.outflow)}`,
            })),
        },
        cashFlow: {
            title: 'Cash flow',
            status: net >= 0 ? 'Positive flow' : 'Negative flow',
            detail: `${signed(net, formatRupee)} ${net >= 0 ? 'surplus' : 'deficit'} this period`,
            bars: monthlyNets.map(v => ({
                value: Math.round((Math.abs(v) / maxAbsNet) * 100),
                positive: v >= 0,
            })),
        },
    };
};

export type InsightsView = ReturnType<typeof toInsightsView>;
