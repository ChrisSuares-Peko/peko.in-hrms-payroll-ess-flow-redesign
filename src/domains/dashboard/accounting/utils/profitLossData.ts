import { FINANCIAL_YEARS, PERIOD_OPTIONS } from './reportFilters';
import { PnlLineItem, ProfitAndLoss } from '../api/reports';

export const REVENUE_COLOR = '#05BE63';
export const EXPENSE_COLOR = '#FF4F4F';
export const NET_PROFIT_COLOR = '#43B75D';

export const profitLossHeader = {
    title: 'Profit & Loss Statement',

    periodLabel: 'Full Year',
    compareLabel: 'Compare',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export interface PeriodOption {
    value: string;
    label: string;
}
export const periodOptions = PERIOD_OPTIONS;

export interface TrendPoint {
    label: string;
    revenue: number;
    expenses: number;
}

export interface NetProfitPoint {
    label: string;
    value: number;
}

export interface ProjectionPoint {
    label: string;
    revenueActual: number | null;
    expensesActual: number | null;
    revenueForecast: number | null;
    expensesForecast: number | null;
}
export const projectionData: ProjectionPoint[] = [
    {
        label: 'April',
        revenueActual: 4.2,
        expensesActual: 3.6,
        revenueForecast: null,
        expensesForecast: null,
    },
    {
        label: 'May',
        revenueActual: 7.1,
        expensesActual: 5.4,
        revenueForecast: null,
        expensesForecast: null,
    },
    {
        label: 'June',
        revenueActual: 10.8,
        expensesActual: 8.1,
        revenueForecast: null,
        expensesForecast: null,
    },
    {
        label: 'July',
        revenueActual: 13.6,
        expensesActual: 11.0,
        revenueForecast: 13.6,
        expensesForecast: 11.0,
    },
    {
        label: 'Aug',
        revenueActual: null,
        expensesActual: null,
        revenueForecast: 12.4,
        expensesForecast: 10.6,
    },
    {
        label: 'Sept',
        revenueActual: null,
        expensesActual: null,
        revenueForecast: 13.8,
        expensesForecast: 11.2,
    },
];
export const projectionForecastStart = 'July';

export const projectionQuarterly: ProjectionPoint[] = [
    {
        label: 'Q1',
        revenueActual: 7.2,
        expensesActual: 5.7,
        revenueForecast: null,
        expensesForecast: null,
    },
    {
        label: 'Q2',
        revenueActual: 14.4,
        expensesActual: 12.4,
        revenueForecast: 14.4,
        expensesForecast: 12.4,
    },
    {
        label: 'Q3',
        revenueActual: null,
        expensesActual: null,
        revenueForecast: 11.8,
        expensesForecast: 9.6,
    },
    {
        label: 'Q4',
        revenueActual: null,
        expensesActual: null,
        revenueForecast: 9.5,
        expensesForecast: 8.2,
    },
];
export const projectionForecastStartQuarterly = 'Q2';

export type RowEmphasis = 'warning' | 'success' | 'subtotal';
export interface StatementRow {
    label: string;
    amount: number;
    emphasis?: RowEmphasis;
}
export interface StatementSection {
    key: string;
    heading?: string;
    rows: StatementRow[];
}

export const statementSections: StatementSection[] = [
    {
        key: 'revenue',
        heading: 'REVENUE',
        rows: [
            { label: 'Product Sales', amount: 1240000 },
            { label: 'Service Income', amount: 360000 },
            { label: 'Other Operating Income', amount: 45000 },
            { label: 'Less: Discounts & Returns', amount: -28000 },
            { label: 'Total Revenue', amount: 1617000, emphasis: 'warning' },
        ],
    },
    {
        key: 'cogs',
        heading: 'COST OF GOODS SOLD',
        rows: [
            { label: 'Raw Material Costs', amount: 480000 },
            { label: 'Direct Labour', amount: 120000 },
            { label: 'Manufacturing Expenses', amount: 80000 },
            { label: 'Inventory Adjustments', amount: 22000 },
            { label: 'Total COGS', amount: 702000, emphasis: 'subtotal' },
            { label: 'Gross Profit', amount: 915000, emphasis: 'subtotal' },
        ],
    },
    {
        key: 'opex',
        heading: 'OPERATING EXPENSES',
        rows: [
            { label: 'Salaries & Wages', amount: 360000 },
            { label: 'Office Rent', amount: 120000 },
            { label: 'Utilities', amount: 48000 },
            { label: 'Marketing & Advertising', amount: 82000 },
            { label: 'Sales Commissions', amount: 45000 },
            { label: 'Software Subscriptions', amount: 38000 },
            { label: 'Professional Fees', amount: 36000 },
            { label: 'Travel & Transportation', amount: 42000 },
            { label: 'Office Supplies', amount: 28000 },
            { label: 'Insurance', amount: 18000 },
            { label: 'Depreciation', amount: 12000 },
            { label: 'Total Operating Expenses', amount: 829000, emphasis: 'subtotal' },
            { label: 'Operating Profit', amount: 86000, emphasis: 'subtotal' },
        ],
    },
    {
        key: 'other-income',
        heading: 'OTHER INCOME',
        rows: [
            { label: 'Interest Income', amount: 18000 },
            { label: 'Miscellaneous Income', amount: 6400 },
            { label: 'Total Other Income', amount: 24400, emphasis: 'subtotal' },
        ],
    },
    {
        key: 'other-expenses',
        heading: 'OTHER EXPENSES',
        rows: [
            { label: 'Loan Interest', amount: 42000 },
            { label: 'Bank Charges', amount: 8400 },
            { label: 'Miscellaneous Expenses', amount: 4200 },
            { label: 'Total Other Expenses', amount: 54600, emphasis: 'subtotal' },
        ],
    },
    {
        key: 'net',
        rows: [
            { label: 'Profit Before Tax', amount: 55800, emphasis: 'subtotal' },
            { label: 'Net Profit', amount: 55800, emphasis: 'success' },
        ],
    },
];
export const detailedStatementTitle = 'Detailed Profit & Loss';

const lineRows = (items: PnlLineItem[] = []): StatementRow[] =>
    items.map(li => ({ label: li.label, amount: li.amount }));

// Maps the profit-and-loss API payload into the ordered statement the card renders:
// each section's line items, its total, and the computed profitability subtotals
// (Gross/Operating Profit, PBT, Net Profit) drawn from the authoritative `summary` block.
export const buildStatementSections = (data: ProfitAndLoss): StatementSection[] => {
    const byKey = new Map(data.sections.map(s => [s.key, s]));
    const { summary } = data;

    const revenue = byKey.get('revenue');
    const cogs = byKey.get('cogs');
    const opex = byKey.get('operatingExpenses');
    const otherIncome = byKey.get('otherIncome');
    const otherExpenses = byKey.get('otherExpenses');
    const tax = byKey.get('tax');

    return [
        {
            key: 'revenue',
            heading: 'REVENUE',
            rows: [
                ...lineRows(revenue?.lineItems),
                {
                    label: revenue?.totalLabel ?? 'Total Revenue',
                    amount: summary.totalRevenue,
                    emphasis: 'warning',
                },
            ],
        },
        {
            key: 'cogs',
            heading: 'COST OF GOODS SOLD',
            rows: [
                ...lineRows(cogs?.lineItems),
                {
                    label: cogs?.totalLabel ?? 'Total COGS',
                    amount: summary.totalCogs,
                    emphasis: 'subtotal',
                },
                { label: 'Gross Profit', amount: summary.grossProfit, emphasis: 'subtotal' },
            ],
        },
        {
            key: 'operatingExpenses',
            heading: 'OPERATING EXPENSES',
            rows: [
                ...lineRows(opex?.lineItems),
                {
                    label: opex?.totalLabel ?? 'Total Operating Expenses',
                    amount: summary.totalOperatingExpenses,
                    emphasis: 'subtotal',
                },
                {
                    label: 'Operating Profit',
                    amount: summary.operatingProfit,
                    emphasis: 'subtotal',
                },
            ],
        },
        {
            key: 'otherIncome',
            heading: 'OTHER INCOME',
            rows: [
                ...lineRows(otherIncome?.lineItems),
                {
                    label: otherIncome?.totalLabel ?? 'Total Other Income',
                    amount: summary.totalOtherIncome,
                    emphasis: 'subtotal',
                },
            ],
        },
        {
            key: 'otherExpenses',
            heading: 'OTHER EXPENSES',
            rows: [
                ...lineRows(otherExpenses?.lineItems),
                {
                    label: otherExpenses?.totalLabel ?? 'Total Other Expenses',
                    amount: summary.totalOtherExpenses,
                    emphasis: 'subtotal',
                },
            ],
        },
        {
            key: 'net',
            rows: [
                {
                    label: 'Profit Before Tax',
                    amount: summary.profitBeforeTax,
                    emphasis: 'subtotal',
                },
                ...lineRows(tax?.lineItems),
                {
                    label: tax?.totalLabel ?? 'Total Tax',
                    amount: summary.tax,
                    emphasis: 'subtotal',
                },
                { label: 'Net Profit', amount: summary.netProfit, emphasis: 'success' },
            ],
        },
    ];
};

export interface SummaryRow {
    label: string;
    value: string;

    note?: string;
    emphasis?: RowEmphasis;
}
export interface ExpenseSlice {
    label: string;
    value: number;
    display: string;
    pct: string;
    color: string;
}

export interface CustomerRevenue {
    name: string;
    pct: number;
    display: string;
}
export const revenueByCustomer = {
    title: 'Revenue by Customer',
    customers: [
        { name: 'Raj Spinners Pvt Ltd', pct: 28.7, display: '₹4.7L' },
        { name: 'Shah Kumar Exports', pct: 21.5, display: '₹3.5L' },
        { name: 'Anand Fabricators', pct: 16.3, display: '₹2.6L' },
        { name: 'Mehta Group', pct: 12.4, display: '₹2.0L' },
        { name: 'Sharma & Associates', pct: 9.8, display: '₹1.6L' },
        { name: 'Others', pct: 11.3, display: '₹1.8L' },
    ] as CustomerRevenue[],
};

export const cardTitles = {
    revenueExpenseTrend: 'Revenue vs Expense Trend',
    netProfitTrend: 'Monthly Net Profit Trend',
    projection: 'Financial Projection — Actual + Forecast',
};
export const projectionSubtitle =
    'Last 6 months actual · Apr–Jun 2026 projected based on trend analysis';

export type TrendRange = 'monthly' | 'quarterly';
export const trendRangeOptions: { value: TrendRange; label: string }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
];
