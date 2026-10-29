import { FINANCIAL_YEARS, PERIOD_OPTIONS } from './reportFilters';

export const OPERATING_COLOR = '#43B75D';
export const INVESTING_COLOR = '#FF4F4F';
export const FINANCING_COLOR = '#F59E0B';

export const cashFlowHeader = {
    title: 'Cash Flow Statement',

    method: 'FY 2025-26 — Indirect Method',
    compareLabel: 'Compare',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export interface PeriodOption {
    value: string;
    label: string;
}
export const periodOptions = PERIOD_OPTIONS;

export interface CfStat {
    key: string;
    label: string;
    value: string;
    delta: string;

    up: boolean;
}
export const summaryStats: CfStat[] = [
    { key: 'operating', label: 'OPERATING CF', value: '₹2.9L', delta: '+18%', up: true },
    { key: 'investing', label: 'INVESTING CF', value: '₹3.4L', delta: '-12%', up: false },
    { key: 'financing', label: 'FINANCING CF', value: '₹1.1L', delta: '+9%', up: true },
    { key: 'net', label: 'NET CASH FLOW', value: '₹56.0K', delta: '+24%', up: true },
    { key: 'closing', label: 'CLOSING BALANCE', value: '₹1.9L', delta: '+18%', up: true },
];

export interface CfRow {
    label: string;
    amount?: number;

    isSubheading?: boolean;
}
export type CfTone = 'success' | 'danger' | 'warning';
export interface CfSection {
    id: string;
    title: string;
    tone: CfTone;
    rows: CfRow[];
    net: { label: string; amount: number };
}

export const cashFlowSections: CfSection[] = [
    {
        id: 'A',
        title: 'A. Cash Flow from Operating Activities',
        tone: 'success',
        rows: [
            { label: 'Net Profit', amount: 56000 },
            { label: 'Non-Cash Adjustments', isSubheading: true },
            { label: 'Add: Depreciation', amount: 187000 },
            { label: 'Add: Amortisation', amount: 60000 },
            { label: 'Working Capital Changes', isSubheading: true },
            { label: 'Decrease in Accounts Receivable', amount: 42000 },
            { label: 'Decrease in Inventory', amount: 28000 },
            { label: 'Increase in Accounts Payable', amount: 35000 },
            { label: 'GST Receivable / Payable Change', amount: -18000 },
            { label: 'Other Working Capital Changes', amount: -100000 },
        ],
        net: { label: 'Net Cash from Operating Activities', amount: 290000 },
    },
    {
        id: 'B',
        title: 'B. Cash Flow from Investing Activities',
        tone: 'danger',
        rows: [
            { label: 'Purchase of Plant & Machinery', amount: -180000 },
            { label: 'Purchase of Computer Equipment', amount: -45000 },
            { label: 'Purchase of Software Assets', amount: -30000 },
            { label: 'Purchase of Vehicles', amount: -90000 },
            { label: 'Sale of Old Furniture', amount: 60000 },
            { label: 'Investment in Fixed Deposits', amount: -55000 },
        ],
        net: { label: 'Net Cash from Investing Activities', amount: -340000 },
    },
    {
        id: 'C',
        title: 'C. Cash Flow from Financing Activities',
        tone: 'warning',
        rows: [
            { label: 'Capital Introduced by Owner', amount: 200000 },
            { label: 'Bank Loan Received', amount: 150000 },
            { label: 'Loan Repayment', amount: -180000 },
            { label: 'Interest Paid on Loans', amount: -64000 },
        ],
        net: { label: 'Net Cash from Financing Activities', amount: 106000 },
    },
];

export const cashFlowStatementTitle = 'Cash Flow Statement';

export const cashFlowSummaryBox = {
    rows: [
        { label: 'Opening Cash Balance', amount: 134000 },
        { label: 'Net Cash Flow (A+B+C)', amount: 56000 },
    ],
    closing: { label: 'Closing Cash Balance', amount: 190000 },
};

export interface CfTrendPoint {
    label: string;
    operating: number;
    investing: number;
    financing: number;
}
export const cashFlowTrendMonthly: CfTrendPoint[] = [
    { label: 'April', operating: 0.4, investing: 0.3, financing: 0.6 },
    { label: 'May', operating: 0.9, investing: 0.6, financing: 1.1 },
    { label: 'June', operating: 1.5, investing: 1.0, financing: 1.7 },
    { label: 'July', operating: 2.1, investing: 1.4, financing: 2.3 },
    { label: 'Aug', operating: 2.6, investing: 1.7, financing: 2.7 },
    { label: 'Sept', operating: 2.9, investing: 1.9, financing: 2.9 },
    { label: 'Oct', operating: 2.7, investing: 2.0, financing: 2.6 },
    { label: 'Nov', operating: 2.4, investing: 1.8, financing: 2.2 },
    { label: 'Dec', operating: 2.1, investing: 1.6, financing: 1.9 },
    { label: 'Jan', operating: 1.8, investing: 1.4, financing: 1.6 },
    { label: 'Feb', operating: 1.5, investing: 1.2, financing: 1.3 },
    { label: 'Mar', operating: 1.3, investing: 1.0, financing: 1.1 },
];
export const cashFlowTrendQuarterly: CfTrendPoint[] = [
    { label: 'Q1', operating: 0.9, investing: 0.6, financing: 1.1 },
    { label: 'Q2', operating: 2.6, investing: 1.7, financing: 2.7 },
    { label: 'Q3', operating: 2.4, investing: 1.8, financing: 2.2 },
    { label: 'Q4', operating: 1.5, investing: 1.2, financing: 1.3 },
];
export const cashFlowTrend = {
    title: 'Cash Flow Trend',
    subtitle: 'Monthly movement across activities',
};

export interface CfCategory {
    label: string;
    value: number;
    display: string;
    color: string;
}
export const categoryComparison = {
    title: 'CF Category Comparison',
    subtitle: 'Net cash by activity (₹ lakhs)',

    items: [
        { label: 'Operating', value: 2.9, display: '₹2.9L', color: OPERATING_COLOR },
        { label: 'Investing', value: -3.4, display: '-₹3.4L', color: INVESTING_COLOR },
        { label: 'Financing', value: 1.1, display: '₹1.1L', color: FINANCING_COLOR },
    ] as CfCategory[],
};

export interface CfBalancePoint {
    label: string;
    balance: number;
}
export const balanceProgressionMonthly: CfBalancePoint[] = [
    { label: 'April', balance: 1.34 },
    { label: 'May', balance: 1.42 },
    { label: 'June', balance: 1.5 },
    { label: 'July', balance: 1.55 },
    { label: 'Aug', balance: 1.6 },
    { label: 'Sept', balance: 1.66 },
    { label: 'Oct', balance: 1.71 },
    { label: 'Nov', balance: 1.76 },
    { label: 'Dec', balance: 1.8 },
    { label: 'Jan', balance: 1.84 },
    { label: 'Feb', balance: 1.87 },
    { label: 'Mar', balance: 1.9 },
];
export const balanceProgressionQuarterly: CfBalancePoint[] = [
    { label: 'Q1', balance: 1.5 },
    { label: 'Q2', balance: 1.66 },
    { label: 'Q3', balance: 1.8 },
    { label: 'Q4', balance: 1.9 },
];
export const balanceProgression = {
    title: 'Cash Balance Progression',
    subtitle: 'Running cash balance (₹ lakhs)',
};

export interface CapexItem {
    label: string;
    display: string;
    pct: number;
}
export const freeCashFlow = {
    title: 'Free Cash Flow Analysis',
    fcf: {
        label: 'FREE CASH FLOW',

        value: '-₹1.1L',
        caption: 'Cash available after capital expenditures',
        note: '-37.9% of Operating CF',
    },
    capex: {
        label: 'CAPITAL EXPENDITURE',

        value: '₹4.0L',
        caption: 'Total outflows from investing activities',
        items: [
            { label: 'Plant & Machinery', display: '₹1.8L', pct: 45.0 },
            { label: 'Computer Equipment', display: '₹45.0K', pct: 11.3 },
            { label: 'Software Assets', display: '₹30.0K', pct: 7.5 },
            { label: 'Vehicles', display: '₹90.0K', pct: 22.5 },
            { label: 'Fixed Deposits', display: '₹55.0K', pct: 13.8 },
        ] as CapexItem[],
    },
    capexRatio: {
        label: 'CAPEX RATIO',

        value: 117.2,
        display: '117.2%',
        caption: 'Investing CF ÷ Operating CF',
    },
};
