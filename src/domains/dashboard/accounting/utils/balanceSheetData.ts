import { FINANCIAL_YEARS, PERIOD_OPTIONS } from './reportFilters';

export const ASSET_COLOR = '#43B75D';
export const LIABILITY_COLOR = '#FF4F4F';
export const EQUITY_COLOR = '#F59E0B';

export const balanceSheetHeader = {
    title: 'Balance Sheet',

    asOf: 'As of 31 Mar 2026',

    dateLabel: '31 March 2026',
    compareLabel: 'Compare',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export interface PeriodOption {
    value: string;
    label: string;
}
export const periodOptions = PERIOD_OPTIONS;

export interface BalanceStat {
    key: string;
    label: string;
    value: string;
    caption: string;
    bg: string;
    border: string;

    valueColor?: string;
}
export const summaryStats: BalanceStat[] = [
    {
        key: 'assets',
        label: 'Total assets',
        value: '₹25.4L',
        caption: 'As of 31 Mar 2026',
        bg: '#F8FAFC',
        border: '#CBD5E1',
    },
    {
        key: 'liabilities',
        label: 'Total liabilities',
        value: '₹10.8L',
        caption: '42.5% of assets',
        bg: '#FEF2F2',
        border: '#FF4F4F',
        valueColor: '#FF4F4F',
    },
    {
        key: 'equity',
        label: 'Total equity',
        value: '₹14.6L',
        caption: '57.5% of assets',
        bg: '#FFFBEB',
        border: '#FCD34D',
    },
    {
        key: 'working-capital',
        label: 'Working capital',
        value: '₹8.9L',
        caption: 'Healthy buffer',
        bg: '#ECFDF5',
        border: '#81CF92',
        valueColor: '#43B75D',
    },
];

export type BsRowKind = 'item' | 'subtotal' | 'total';
export interface BsRow {
    label: string;
    amount: number;
    kind?: BsRowKind;

    tone?: 'success' | 'error';
}
export interface BsSubSection {
    heading: string;
    rows: BsRow[];
}
export interface BsColumn {
    title: string;
    sections: BsSubSection[];
    total: BsRow;
}

export const balanceSheetStatement: {
    title: string;
    assets: BsColumn;
    liabilities: BsColumn;
} = {
    title: 'Balance Sheet Statement',
    assets: {
        title: 'Assets',
        sections: [
            {
                heading: 'CURRENT ASSETS',
                rows: [
                    { label: 'Cash & Bank Balance', amount: 520000 },
                    { label: 'Accounts Receivable', amount: 410000 },
                    { label: 'Inventory / Stock', amount: 280000 },
                    { label: 'GST Input Tax Credit', amount: 45000 },
                    { label: 'Prepaid Expenses', amount: 38000 },
                    { label: 'Short-Term Investments', amount: 72000 },
                    {
                        label: 'Total Current Assets',
                        amount: 1365000,
                        kind: 'subtotal',
                        tone: 'success',
                    },
                ],
            },
            {
                heading: 'NON-CURRENT ASSETS',
                rows: [
                    { label: 'Plant & Machinery', amount: 680000 },
                    { label: 'Furniture & Fixtures', amount: 120000 },
                    { label: 'Vehicles', amount: 240000 },
                    { label: 'Computer Equipment', amount: 85000 },
                    { label: 'Software Assets', amount: 60000 },
                    { label: 'Long-Term Investments', amount: 180000 },
                    { label: 'Accumulated Depreciation', amount: -187000 },
                    {
                        label: 'Total Non-Current Assets',
                        amount: 1178000,
                        kind: 'subtotal',
                        tone: 'success',
                    },
                ],
            },
        ],
        total: { label: 'TOTAL ASSETS', amount: 2543000, kind: 'total', tone: 'success' },
    },
    liabilities: {
        title: 'Liabilities & Equity',
        sections: [
            {
                heading: 'CURRENT LIABILITIES',
                rows: [
                    { label: 'Accounts Payable', amount: 210000 },
                    { label: 'GST Payable', amount: 64000 },
                    { label: 'TDS Payable', amount: 28000 },
                    { label: 'Salaries Payable', amount: 85000 },
                    { label: 'Short-Term Loans', amount: 60000 },
                    { label: 'Accrued Expenses', amount: 28000 },
                    {
                        label: 'Total Current Liabilities',
                        amount: 475000,
                        kind: 'subtotal',
                        tone: 'error',
                    },
                ],
            },
            {
                heading: 'LONG-TERM LIABILITIES',
                rows: [
                    { label: 'Long-Term Borrowings', amount: 606000 },
                    {
                        label: 'Total Long-Term Liabilities',
                        amount: 606000,
                        kind: 'subtotal',
                        tone: 'error',
                    },
                ],
            },
            {
                heading: 'EQUITY',
                rows: [
                    { label: "Owner's Capital", amount: 900000 },
                    { label: 'Retained Earnings', amount: 506200 },
                    { label: 'Current Year Profit', amount: 55800 },
                    { label: 'Total Equity', amount: 1462000, kind: 'subtotal', tone: 'success' },
                ],
            },
        ],
        total: {
            label: 'TOTAL LIABILITIES + EQUITY',
            amount: 2543000,
            kind: 'total',
            tone: 'success',
        },
    },
};

export interface OverviewSlice {
    label: string;
    // numeric magnitude that sets the segment's share of the ring
    value: number;
    // formatted amount shown in the legend, e.g. '₹10.8L'
    display: string;
    // formatted percentage shown in the legend, e.g. '42.5%'
    pct: string;
    color: string;
}
export interface OverviewDonut {
    centerLabel: string;
    centerValue: string;
    slices: OverviewSlice[];
}
export const overviewBars = {
    title: 'Assets vs Liabilities Overview',
    subtitle: 'Comparative overview of financial structure',
    centerLabel: 'Total Value',
    centerValue: '₹25.4L',
    slices: [
        { label: 'Total Liabilities', value: 42.5, display: '₹10.8L', pct: '42.5%', color: LIABILITY_COLOR },
        { label: 'Total equity', value: 57.5, display: '₹14.6L', pct: '57.5%', color: EQUITY_COLOR },
    ] as OverviewSlice[],
};

export interface WcMetric {
    label: string;
    value: string;
    status: string;
    tone: 'success' | 'warning';

    highlight?: boolean;
}
export const workingCapital = {
    title: 'Working Capital Analysis',
    subtitle: 'Liquidity and leverage metrics',
    metrics: [
        {
            label: 'Working Capital',
            value: '₹8.9L',
            status: 'Healthy',
            tone: 'success',
            highlight: true,
        },
        { label: 'Current Ratio', value: '2.87', status: 'Healthy', tone: 'success' },
        { label: 'Quick Ratio', value: '2.28', status: 'Healthy', tone: 'success' },
        { label: 'Debt-to-Equity', value: '0.74', status: 'Moderate', tone: 'warning' },
    ] as WcMetric[],
    caVsClLabel: 'CURRENT ASSETS VS CURRENT LIABILITIES',
    currentAssets: { display: '₹13.6L', pct: 74 },
    currentLiabilities: { display: '₹4.8L', pct: 26 },
};

export interface CompositionSlice {
    label: string;
    value: number;
    display: string;
    pct: string;
    color: string;
}
export const assetComposition = {
    title: 'Assets vs Liabilities Overview',
    subtitle: 'Breakdown by asset type',
    centerLabel: 'Total assets',
    centerValue: '₹25.4L',
    slices: [
        { label: 'Cash & Bank', value: 520000, display: '₹5.2L', pct: '20.4%', color: '#14B8A6' },
        { label: 'Receivables', value: 410000, display: '₹4.1L', pct: '16.1%', color: '#6366F1' },
        { label: 'Inventory', value: 280000, display: '₹2.8L', pct: '11.0%', color: '#EC4899' },
        { label: 'Fixed Assets', value: 998000, display: '₹10.0L', pct: '39.2%', color: '#F59E0B' },
        { label: 'Investments', value: 252000, display: '₹2.5L', pct: '9.9%', color: '#3B82F6' },
        { label: 'Other', value: 83000, display: '₹83.0K', pct: '3.3%', color: '#FACC15' },
    ] as CompositionSlice[],
};
export const liabilityComposition = {
    title: 'Liability Composition',
    subtitle: 'Breakdown by liability type',
    centerLabel: 'Total liabilities',
    centerValue: '₹10.8L',
    slices: [
        {
            label: 'Accounts Payable',
            value: 210000,
            display: '₹2.1L',
            pct: '19.4%',
            color: '#EC4899',
        },
        { label: 'Loans', value: 666000, display: '₹6.7L', pct: '61.6%', color: '#FF4F4F' },
        { label: 'Taxes Payable', value: 92000, display: '₹92.0K', pct: '8.5%', color: '#F59E0B' },
        {
            label: 'Other Liabilities',
            value: 113000,
            display: '₹1.1L',
            pct: '10.5%',
            color: '#6366F1',
        },
    ] as CompositionSlice[],
};

export interface BsTrendPoint {
    label: string;
    assets: number;
    liabilities: number;
    equity: number;
}
export const balanceSheetTrendMonthly: BsTrendPoint[] = [
    { label: 'April', assets: 18.6, liabilities: 9.2, equity: 9.4 },
    { label: 'May', assets: 19.4, liabilities: 9.4, equity: 10.0 },
    { label: 'June', assets: 20.5, liabilities: 9.7, equity: 10.8 },
    { label: 'July', assets: 21.6, liabilities: 9.9, equity: 11.7 },
    { label: 'Aug', assets: 22.4, liabilities: 10.1, equity: 12.3 },
    { label: 'Sept', assets: 23.1, liabilities: 10.2, equity: 12.9 },
    { label: 'Oct', assets: 23.8, liabilities: 10.4, equity: 13.4 },
    { label: 'Nov', assets: 24.3, liabilities: 10.5, equity: 13.8 },
    { label: 'Dec', assets: 24.7, liabilities: 10.6, equity: 14.1 },
    { label: 'Jan', assets: 25.0, liabilities: 10.7, equity: 14.3 },
    { label: 'Feb', assets: 25.2, liabilities: 10.8, equity: 14.4 },
    { label: 'Mar', assets: 25.4, liabilities: 10.8, equity: 14.6 },
];
export const balanceSheetTrendQuarterly: BsTrendPoint[] = [
    { label: 'Q1', assets: 20.5, liabilities: 9.7, equity: 10.8 },
    { label: 'Q2', assets: 23.1, liabilities: 10.2, equity: 12.9 },
    { label: 'Q3', assets: 24.7, liabilities: 10.6, equity: 14.1 },
    { label: 'Q4', assets: 25.4, liabilities: 10.8, equity: 14.6 },
];
export const balanceSheetTrend = {
    title: 'Balance Sheet Trend',
    subtitle: '12-month trend of assets, liabilities and equity',
};

export interface InsightTile {
    key: string;
    title: string;
    text: string;
}
export const balanceSheetInsights = {
    title: 'Balance Sheet Insights',
    tiles: [
        {
            key: 'asset-quality',
            title: 'Asset Quality',
            text: 'Fixed assets represent 39.2% of total assets. Consider reviewing depreciation schedules and asset utilisation to maximise returns.',
        },
        {
            key: 'liquidity',
            title: 'Liquidity',
            text: 'Current ratio of 2.87 indicates healthy short-term liquidity position. Quick ratio of 2.28 confirms sufficient liquid asset coverage.',
        },
        {
            key: 'leverage',
            title: 'Leverage',
            text: 'Debt-to-equity ratio of 0.74. Business is moderately leveraged. Total borrowings stand at ₹10.8L.',
        },
        {
            key: 'working-capital',
            title: 'Working Capital',
            text: 'Working capital of ₹8.9L available. Adequate buffer for day-to-day operations and short-term obligations.',
        },
    ] as InsightTile[],
};
