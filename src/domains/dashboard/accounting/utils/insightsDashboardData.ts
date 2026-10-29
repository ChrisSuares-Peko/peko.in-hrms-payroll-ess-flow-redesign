export const dashboardColors = {
    revenueGrowth: '#43B75D',
    profitMargin: '#EF4444',
    cashFlow: '#F59E0B',
    gstCompliance: '#3B82F6',
    arHealth: '#EC4899',

    gaugeFill: '#43B75D',
    gaugeTrack: '#E5E7EB',

    revenueBar: '#9FDBB0',
    expenseBar: '#F7B2B2',
    netProfitLine: '#1E293B',
    grid: '#E9EEF3',
    axis: '#94A3B8',
};

export const insightsPage = {
    title: 'Insights',
    subtitle: 'Peko Textile Industries Pvt Ltd · FY 2025–26',
    exportLabel: 'Export',
    fyOptions: [
        { key: 'fy-2025-26', label: 'FY 2025-26' },
        { key: 'fy-2024-25', label: 'FY 2024-25' },
    ],
};

export const insightsTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'expense', label: 'Expense' },
    { key: 'profitability', label: 'Profitability' },
    { key: 'cash-flow', label: 'Cash flow' },
    { key: 'tax-gst', label: 'Tax & GST' },
    { key: 'working-capital', label: 'Working capital' },
];

export type InsightsTabKey = (typeof insightsTabs)[number]['key'];

export type Tone = 'ink' | 'success' | 'danger' | 'warning' | 'muted';

export interface KpiCardItem {
    key: string;
    label: string;
    value: string;
    valueTone?: Tone;
    sub: string;

    tail?: { text: string; tone?: Tone; arrow?: boolean };
}

export const primaryKpis: KpiCardItem[] = [
    {
        key: 'revenue',
        label: 'Total Revenue',
        value: '₹1.01Cr',
        sub: 'Apr 2025 – Mar 2026',
        tail: { text: '+18%', tone: 'success', arrow: true },
    },
    {
        key: 'expenses',
        label: 'Total Expenses',
        value: '₹82.4L',
        sub: 'vs ₹71.42L last FY',
        tail: { text: '+15%', tone: 'danger', arrow: true },
    },
    {
        key: 'net-profit',
        label: 'Net Profit',
        value: '₹18.9L',
        sub: '18.7% net margin',
        tail: { text: '+21%', tone: 'success', arrow: true },
    },
    {
        key: 'cash-balance',
        label: 'Cash Balance',
        value: '₹24.6L',
        sub: 'as of Mar 2026',
        tail: { text: '+18%', tone: 'success', arrow: true },
    },
];

export const secondaryKpis: KpiCardItem[] = [
    {
        key: 'net-margin',
        label: 'Net Margin',
        value: '18.7%',
        valueTone: 'success',
        sub: 'Target 20%',
        tail: { text: '0.8pp YoY', tone: 'success', arrow: true },
    },
    {
        key: 'ar-outstanding',
        label: 'AR Outstanding',
        value: '₹6.38L',
        valueTone: 'danger',
        sub: '7.1% overdue',
        tail: { text: '₹55,000 at risk', tone: 'danger' },
    },
    {
        key: 'ap-outstanding',
        label: 'AP Outstanding',
        value: '₹3.22L',
        valueTone: 'warning',
        sub: '5.7% overdue',
        tail: { text: '₹18,500 past due', tone: 'warning' },
    },
];

export interface HealthMetric {
    key: string;
    label: string;
    value: string;

    percent: number;
    color: string;
}

export const businessHealth = {
    title: 'Business Health Score',
    subtitle: 'Composite AI-calculated score',
    score: 77,
    metrics: [
        {
            key: 'revenue-growth',
            label: 'Revenue Growth',
            value: '₹4.7L',
            percent: 71,
            color: dashboardColors.revenueGrowth,
        },
        {
            key: 'profit-margin',
            label: 'Profit Margin',
            value: '₹4.7L',
            percent: 30,
            color: dashboardColors.profitMargin,
        },
        {
            key: 'cash-flow',
            label: 'Cash Flow',
            value: '₹4.7L',
            percent: 58,
            color: dashboardColors.cashFlow,
        },
        {
            key: 'gst-compliance',
            label: 'GST Compliance',
            value: '₹4.7L',
            percent: 67,
            color: dashboardColors.gstCompliance,
        },
        {
            key: 'ar-health',
            label: 'AR Health',
            value: '₹4.7L',
            percent: 44,
            color: dashboardColors.arHealth,
        },
    ] as HealthMetric[],
};

export interface BarLineSeries {
    dataKey: string;
    color: string;
}

export interface BarLineChartData {
    title: string;
    subtitle: string;
    ticks: number[];

    xKey: string;

    xSubKey?: string;
    bars: BarLineSeries[];
    line: BarLineSeries;
    points: Array<Record<string, string | number>>;
}

export const revenueVsExpenses: BarLineChartData = {
    title: 'Revenue vs Expenses',
    subtitle: 'Monthly FY 2025–26 with Net Profit trend',
    ticks: [0, 4.5, 9, 13.6, 18.1],
    xKey: 'month',
    bars: [
        { dataKey: 'revenue', color: dashboardColors.revenueBar },
        { dataKey: 'expense', color: dashboardColors.expenseBar },
    ],
    line: { dataKey: 'profit', color: dashboardColors.netProfitLine },
    points: [
        { month: 'Apr', revenue: 9.0, expense: 8.1, profit: 1.1 },
        { month: 'May', revenue: 8.7, expense: 8.0, profit: 0.8 },
        { month: 'Jun', revenue: 9.0, expense: 7.6, profit: 2.2 },
        { month: 'Jul', revenue: 9.1, expense: 7.4, profit: 3.5 },
        { month: 'Aug', revenue: 9.0, expense: 7.5, profit: 3.8 },
        { month: 'Sep', revenue: 9.2, expense: 7.5, profit: 3.9 },
        { month: 'Oct', revenue: 9.1, expense: 7.3, profit: 4.2 },
        { month: 'Nov', revenue: 9.3, expense: 7.2, profit: 5.0 },
        { month: 'Dec', revenue: 8.9, expense: 7.8, profit: 2.0 },
        { month: 'Jan', revenue: 8.7, expense: 8.0, profit: 0.9 },
        { month: 'Feb', revenue: 9.0, expense: 7.6, profit: 2.2 },
        { month: 'Mar', revenue: 9.1, expense: 7.7, profit: 2.0 },
    ],
};

export interface TrendPoint {
    period: string;
    value: number;
}

export const revenueTrend: TrendChartData = {
    title: 'Revenue Trend',
    subtitle: 'Total revenue by period',
    ticks: [0, 4.5, 9, 13.6, 18.1],
    color: '#43B75D',
    monthly: [
        { period: 'Apr', value: 2.6 },
        { period: 'May', value: 3.4 },
        { period: 'Jun', value: 4.2 },
        { period: 'Jul', value: 6.0 },
        { period: 'Aug', value: 8.5 },
        { period: 'Sep', value: 11.2 },
        { period: 'Oct', value: 14.0 },
        { period: 'Nov', value: 15.2 },
        { period: 'Dec', value: 14.4 },
        { period: 'Jan', value: 13.0 },
        { period: 'Feb', value: 11.6 },
        { period: 'Mar', value: 10.6 },
    ] as TrendPoint[],
    quarterly: [
        { period: 'Q1', value: 3.4 },
        { period: 'Q2', value: 8.6 },
        { period: 'Q3', value: 14.5 },
        { period: 'Q4', value: 11.7 },
    ] as TrendPoint[],
};

export interface DonutSegment {
    key: string;
    label: string;
    value: string;
    percent: number;
    color: string;
}

export const revenueStreams: DonutBreakdownData = {
    title: 'Revenue Streams',
    subtitle: 'Revenue by stream',
    totalLabel: 'Total Value',
    totalValue: '₹16.1L',
    segments: [
        {
            key: 'fabric',
            label: 'Product Sales - Fabric',
            value: '₹3.6L',
            percent: 22.4,
            color: '#F59E0B',
        },
        {
            key: 'yarn',
            label: 'Product Sales — Yarn',
            value: '₹86.0K',
            percent: 5.1,
            color: '#3B82F6',
        },
        {
            key: 'readymade',
            label: 'Product Sales — Readymade',
            value: '₹1.2L',
            percent: 7.5,
            color: '#43B75D',
        },
        {
            key: 'stitching',
            label: 'Service Income — Stitching',
            value: '₹86.0K',
            percent: 5.1,
            color: '#EF4444',
        },
        {
            key: 'finishing',
            label: 'Service Income — Finishing',
            value: '₹86.0K',
            percent: 5.1,
            color: '#A855F7',
        },
        {
            key: 'consulting',
            label: 'Consulting Income',
            value: '₹86.0K',
            percent: 5.1,
            color: '#14B8A6',
        },
        {
            key: 'subscription',
            label: 'Subscription Revenue',
            value: '₹86.0K',
            percent: 5.1,
            color: '#EC4899',
        },
        {
            key: 'other',
            label: 'Other Operating Income',
            value: '₹86.0K',
            percent: 5.1,
            color: '#EAB308',
        },
    ] as DonutSegment[],
};

export interface RankedItem {
    key: string;
    name: string;
    value: string;
    percent: number;
    color: string;
}

export const topCustomers: RankedBarListData = {
    title: 'Top Customers',
    subtitle: 'By annual revenue contribution',
    items: [
        { key: 'raj', name: 'Raj Spinners Pvt', value: '₹2.4L', percent: 100, color: '#EF4444' },
        { key: 'patel', name: 'Patel Textiles', value: '₹1.9L', percent: 79, color: '#F59E0B' },
        { key: 'shah', name: 'Shah Kumar Exports', value: '₹1.6L', percent: 67, color: '#A855F7' },
        { key: 'mehta', name: 'Mehta Group', value: '₹1.3L', percent: 54, color: '#6366F1' },
        { key: 'anand', name: 'Anand Fabricators', value: '₹1.1L', percent: 46, color: '#06B6D4' },
        { key: 'verma', name: 'Verma Industries', value: '₹0.9L', percent: 38, color: '#3B82F6' },
    ] as RankedItem[],
};

export interface TrendChartData {
    title: string;
    subtitle: string;
    color: string;
    ticks: number[];
    monthly: TrendPoint[];

    quarterly?: TrendPoint[];
}

export interface DonutBreakdownData {
    title: string;
    subtitle: string;
    totalLabel: string;
    totalValue: string;
    segments: DonutSegment[];
}

export interface RankedBarListData {
    title: string;
    subtitle: string;
    items: RankedItem[];
}

export const expenseTrend: TrendChartData = {
    title: 'Expense Trend',
    subtitle: 'Total spend by period',
    ticks: [0, 4.5, 9, 13.6, 18.1],
    color: '#FF4F4F',
    monthly: [
        { period: 'Apr', value: 2.4 },
        { period: 'May', value: 3.0 },
        { period: 'Jun', value: 4.5 },
        { period: 'Jul', value: 6.5 },
        { period: 'Aug', value: 9.5 },
        { period: 'Sep', value: 12.5 },
        { period: 'Oct', value: 14.8 },
        { period: 'Nov', value: 15.0 },
        { period: 'Dec', value: 14.0 },
        { period: 'Jan', value: 13.2 },
        { period: 'Feb', value: 11.8 },
        { period: 'Mar', value: 10.8 },
    ],
    quarterly: [
        { period: 'Q1', value: 3.3 },
        { period: 'Q2', value: 9.5 },
        { period: 'Q3', value: 14.6 },
        { period: 'Q4', value: 11.9 },
    ],
};

export const expenseCategories: DonutBreakdownData = {
    title: 'Category Breakdown',
    subtitle: 'Expenses by type',
    totalLabel: 'Total Value',
    totalValue: '₹16.1L',
    segments: [
        { key: 'salary', label: 'Salary', value: '₹86.0K', percent: 5.1, color: '#EF4444' },
        { key: 'rent', label: 'Rent', value: '₹3.6L', percent: 22.4, color: '#F59E0B' },
        {
            key: 'professional',
            label: 'Professional fees',
            value: '₹1.2L',
            percent: 7.5,
            color: '#6366F1',
        },
        { key: 'marketing', label: 'Marketing', value: '₹86.0K', percent: 5.1, color: '#3B82F6' },
        {
            key: 'software',
            label: 'Software subscription',
            value: '₹86.0K',
            percent: 5.1,
            color: '#06B6D4',
        },
        { key: 'travel', label: 'Travel', value: '₹86.0K', percent: 5.1, color: '#14B8A6' },
        { key: 'utilities', label: 'Utilities', value: '₹86.0K', percent: 5.1, color: '#EC4899' },
        {
            key: 'office',
            label: 'Office supplies',
            value: '₹86.0K',
            percent: 5.1,
            color: '#A855F7',
        },
    ],
};

export const expenseTopVendors: RankedBarListData = {
    title: 'Top Vendors',
    subtitle: 'By annual spend',
    items: [
        { key: 'payroll', name: 'Payroll', value: '₹2.4L', percent: 100, color: '#EF4444' },
        { key: 'rahul', name: 'Rahul Properties', value: '₹1.9L', percent: 79, color: '#F59E0B' },
        { key: 'sharma', name: 'Sharma CA Firm', value: '₹1.6L', percent: 67, color: '#A855F7' },
        { key: 'google-ads', name: 'Google Ads', value: '₹1.3L', percent: 54, color: '#6366F1' },
        {
            key: 'legal-eagle',
            name: 'Legal Eagle LLP',
            value: '₹1.1L',
            percent: 46,
            color: '#06B6D4',
        },
        { key: 'facebook', name: 'Facebook India', value: '₹0.9L', percent: 38, color: '#EC4899' },
    ],
};

export interface ProfitTrendPoint {
    month: string;
    gross: number;
    net: number;
}

export interface MonthValuePoint {
    month: string;
    value: number;
}

export interface PnlRow {
    label: string;
    value: string;
    tone: 'success' | 'danger';
}

export interface ProfitTrendData {
    title: string;
    subtitle: string;
    ticks: number[];
    points: ProfitTrendPoint[];
}

export interface MonthlyBarChartData {
    title: string;
    subtitle: string;
    ticks: number[];
    color: string;
    points: MonthValuePoint[];
    // Axis unit: 'lakhs' (default, ₹X.XL) or 'percent' (X%). Used for e.g. net-margin charts.
    unit?: 'lakhs' | 'percent';
}

export interface PnlSummaryData {
    title: string;
    subtitle: string;
    rows: PnlRow[];
    total: PnlRow;

    footer?: { label: string; value: string };
}

export const profitTrend: ProfitTrendData = {
    title: 'Profit Trend',
    subtitle: 'Gross Profit vs Net Profit monthly',
    ticks: [0, 4.5, 9, 13.6, 18.1],
    points: [
        { month: 'Apr', gross: 6.0, net: 1.5 },
        { month: 'May', gross: 6.5, net: 2.0 },
        { month: 'Jun', gross: 7.5, net: 3.0 },
        { month: 'Jul', gross: 8.5, net: 4.5 },
        { month: 'Aug', gross: 10.5, net: 6.5 },
        { month: 'Sep', gross: 13.0, net: 9.0 },
        { month: 'Oct', gross: 15.0, net: 11.5 },
        { month: 'Nov', gross: 15.8, net: 12.8 },
        { month: 'Dec', gross: 15.2, net: 12.2 },
        { month: 'Jan', gross: 14.5, net: 11.5 },
        { month: 'Feb', gross: 13.5, net: 10.2 },
        { month: 'Mar', gross: 13.0, net: 9.5 },
    ],
};

export const netMarginByMonth: MonthlyBarChartData = {
    title: 'Net Margin by Month',
    subtitle: '% margin trend',
    ticks: [0, 4.5, 9],
    color: '#F59E0B',
    points: [
        { month: 'Apr', value: 8.5 },
        { month: 'May', value: 6.8 },
        { month: 'Jun', value: 9.0 },
        { month: 'Jul', value: 6.6 },
        { month: 'Aug', value: 8.8 },
        { month: 'Sep', value: 6.5 },
        { month: 'Oct', value: 9.0 },
        { month: 'Nov', value: 6.4 },
        { month: 'Dec', value: 8.9 },
        { month: 'Jan', value: 6.2 },
        { month: 'Feb', value: 8.7 },
        { month: 'Mar', value: 6.5 },
    ],
};

export const pnlSummary: PnlSummaryData = {
    title: 'P&L Summary',
    subtitle: 'Full year FY 2025–26',
    rows: [
        { label: 'Total Revenue', value: '₹1,01,10,000', tone: 'success' },
        { label: 'Less: Total Expenses', value: '(₹65,71,500)', tone: 'danger' },
        { label: 'Gross Profit', value: '₹35,38,500', tone: 'success' },
        { label: 'Operating Expenses (est.)', value: '(₹16,48,500)', tone: 'danger' },
    ],
    total: { label: 'Net Profit', value: '₹18,90,000', tone: 'success' },
};

export type CashFlowTone = 'positive' | 'negative' | 'neutral';

export interface CashFlowItem {
    key: string;
    label: string;
    value: string;
    tone: CashFlowTone;
}

export interface CashFlowSummaryData {
    title: string;
    subtitle: string;
    items: CashFlowItem[];
}

export const cashBalanceTrend: TrendChartData = {
    title: 'Cash Balance Trend',
    subtitle: 'Cumulative cash position Apr 2025 – Mar 2026',
    ticks: [0, 4.5, 9, 13.6, 18.1],
    color: '#F59E0B',
    monthly: [
        { period: 'Apr', value: 5.0 },
        { period: 'May', value: 5.6 },
        { period: 'Jun', value: 6.6 },
        { period: 'Jul', value: 8.2 },
        { period: 'Aug', value: 11.0 },
        { period: 'Sep', value: 14.5 },
        { period: 'Oct', value: 17.4 },
        { period: 'Nov', value: 17.8 },
        { period: 'Dec', value: 17.0 },
        { period: 'Jan', value: 16.0 },
        { period: 'Feb', value: 15.0 },
        { period: 'Mar', value: 14.2 },
    ],
};

export const cashFlowSummary: CashFlowSummaryData = {
    title: 'Cash Flow Summary',
    subtitle: 'Operating, Investing & Financing',
    items: [
        { key: 'operating', label: 'Operating Cash Flow', value: '+₹17.39L', tone: 'positive' },
        { key: 'investing', label: 'Investing Activities', value: '−₹2.12L', tone: 'negative' },
        { key: 'financing', label: 'Financing Activities', value: '₹0', tone: 'neutral' },
    ],
};

export const fcfTrend: TrendChartData = {
    title: 'Free Cash Flow Trend',
    subtitle: 'Operating FCF monthly',
    ticks: [0, 4.5, 9, 13.6, 18.1],
    color: '#3B82F6',
    monthly: [
        { period: 'Apr', value: 0.5 },
        { period: 'May', value: 0.8 },
        { period: 'Jun', value: 1.2 },
        { period: 'Jul', value: 2.0 },
        { period: 'Aug', value: 3.0 },
        { period: 'Sep', value: 4.5 },
        { period: 'Oct', value: 7.0 },
        { period: 'Nov', value: 10.0 },
        { period: 'Dec', value: 12.5 },
        { period: 'Jan', value: 14.5 },
        { period: 'Feb', value: 16.0 },
        { period: 'Mar', value: 17.4 },
    ],
};

export const taxCashFlow: BarLineChartData = {
    title: 'Cash Flow Summary',
    subtitle: 'Operating, Investing & Financing',
    ticks: [0, 4.5, 9, 13.6, 18.1],
    xKey: 'period',
    xSubKey: 'range',
    bars: [
        { dataKey: 'inflow', color: dashboardColors.revenueBar },
        { dataKey: 'outflow', color: dashboardColors.expenseBar },
    ],
    line: { dataKey: 'net', color: dashboardColors.netProfitLine },
    points: [
        { period: 'Q1', range: 'April-June', inflow: 9.2, outflow: 8.0, net: 3.5 },
        { period: 'Q2', range: 'July-Sept', inflow: 9.5, outflow: 8.2, net: 4.8 },
        { period: 'Q3', range: 'Oct-Dec', inflow: 9.8, outflow: 8.0, net: 6.0 },
        { period: 'Q4', range: 'Jan-Mar', inflow: 9.0, outflow: 8.3, net: 4.0 },
    ],
};

export const gstSummary: PnlSummaryData = {
    title: 'GST Summary',
    subtitle: 'FY 2025–26 annual',
    rows: [
        { label: 'Total Taxable Turnover', value: '₹1,01,10,000', tone: 'success' },
        { label: 'Output GST Collected', value: '(₹18,19,800)', tone: 'danger' },
        { label: 'Input Tax Credit (ITC)', value: '₹16,05,800', tone: 'success' },
    ],

    total: { label: 'Net GST Payable', value: '₹2,14,000', tone: 'success' },
    footer: { label: 'ITC Utilisation Rate', value: '40.1%' },
};

export type FilingStatus = 'due' | 'filed' | 'overdue';

export interface FilingItem {
    key: string;
    title: string;
    subtitle: string;
    status: FilingStatus;
}

export interface FilingCalendarData {
    title: string;
    subtitle: string;
    items: FilingItem[];
}

export const filingCalendar: FilingCalendarData = {
    title: 'Filing Calendar',
    subtitle: 'GST return status',
    items: [
        {
            key: 'mar',
            title: 'GSTR-1 (Monthly)',
            subtitle: 'Mar 2026 · Due 11 Apr 2026',
            status: 'due',
        },
        {
            key: 'feb',
            title: 'GSTR-1 (Monthly)',
            subtitle: 'Feb 2026 · 11 Mar 2026',
            status: 'filed',
        },
        {
            key: 'jan',
            title: 'GSTR-1 (Monthly)',
            subtitle: 'Jan 2026 · 11 Feb 2026',
            status: 'filed',
        },
        {
            key: 'dec',
            title: 'GSTR-1 (Monthly)',
            subtitle: 'Dec 2025 · 11 Jan 2026',
            status: 'filed',
        },
        {
            key: 'nov',
            title: 'GSTR-1 (Monthly)',
            subtitle: 'Nov 2025 · 11 Dec 2025',
            status: 'filed',
        },
    ],
};

export interface WcMetric {
    key: string;
    label: string;
    value: string;
    unit: string;
    tone: Tone;
    title: string;
    sub: string;
}

export interface AgingBucket {
    key: string;
    label: string;
    percent: number;
    value: string;
    color: string;
}

export interface AgingData {
    title: string;
    subtitle: string;
    totalShort: string;
    buckets: AgingBucket[];
}

export const workingCapitalMetrics: WcMetric[] = [
    {
        key: 'dso',
        label: 'DSO',
        value: '42',
        unit: 'days',
        tone: 'danger',
        title: 'Days Sales Outstanding',
        sub: 'Avg. time to collect receivables',
    },
    {
        key: 'dpo',
        label: 'DPO',
        value: '42',
        unit: 'days',
        tone: 'ink',
        title: 'Days Payable Outstanding',
        sub: 'Avg. time to pay vendors',
    },
    {
        key: 'ccc',
        label: 'CCC',
        value: '4',
        unit: 'days',
        tone: 'success',
        title: 'Cash Conversion Cycle',
        sub: 'DSO − DPO (lower is better)',
    },
];

export const AGING_COLORS = {
    current: '#43B75D',
    warning: '#F59E0B',
    overdue: '#EF4444',
    severe: '#B91C1C',
};

export const arAging: AgingData = {
    title: 'Accounts Receivable Aging',
    subtitle: 'Total outstanding: ₹6,38,500',
    totalShort: '₹6.38L',
    buckets: [
        {
            key: '0-30',
            label: '0–30 days',
            percent: 54.8,
            value: '₹3.5L',
            color: AGING_COLORS.current,
        },
        {
            key: '31-60',
            label: '31–60 days',
            percent: 24.7,
            value: '₹1.58L',
            color: AGING_COLORS.warning,
        },
        {
            key: '61-90',
            label: '61–90 days',
            percent: 11.9,
            value: '₹76K',
            color: AGING_COLORS.overdue,
        },
        { key: '90+', label: '90+ days', percent: 8.6, value: '₹55K', color: AGING_COLORS.severe },
    ],
};

export const apAging: AgingData = {
    title: 'Accounts Payable Aging',
    subtitle: 'Total outstanding: ₹3,22,000',
    totalShort: '₹3.22L',
    buckets: [
        {
            key: '0-30',
            label: '0–30 days',
            percent: 60.1,
            value: '₹1.94L',
            color: AGING_COLORS.current,
        },
        {
            key: '31-60',
            label: '31–60 days',
            percent: 22.0,
            value: '₹71K',
            color: AGING_COLORS.warning,
        },
        {
            key: '61-90',
            label: '61–90 days',
            percent: 12.1,
            value: '₹39K',
            color: AGING_COLORS.overdue,
        },
        {
            key: '90+',
            label: '90+ days',
            percent: 5.7,
            value: '₹18.5K',
            color: AGING_COLORS.severe,
        },
    ],
};
