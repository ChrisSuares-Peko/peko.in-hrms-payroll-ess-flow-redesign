import { paths } from '@src/routes/paths';

import { FINANCIAL_YEARS_LONG, PERIOD_OPTIONS } from './reportFilters';
import alignBottom from '../assets/align-bottom.svg';
import card from '../assets/card.svg';
import graph from '../assets/graph.svg';
import moneys from '../assets/moneys.svg';
import note from '../assets/note.svg';
import profile from '../assets/profile.svg';
import revenueGraph from '../assets/revenue-graph.svg';
import statusUp from '../assets/status-up.svg';

export const financialStatementsHeader = {
    title: 'Financial Statements',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS_LONG;

export interface PeriodOption {
    value: string;
    label: string;
}

export const periodOptions = PERIOD_OPTIONS;

export interface ReportItem {
    key: string;
    title: string;
    description: string;

    icon: string;

    path?: string;
}

export interface ReportGroup {
    key: string;
    heading: string;
    items: ReportItem[];
}

export const reportGroups: ReportGroup[] = [
    {
        key: 'core',
        heading: 'Core statements',
        items: [
            {
                key: 'profit-loss',
                title: 'Profit & Loss',
                description: 'Revenue, expenses and net profit for the period.',
                icon: statusUp,
                path: `${paths.dashboard.accounting}/${paths.accounting.profitLoss}`,
            },
            {
                key: 'balance-sheet',
                title: 'Balance Sheet',
                description: 'Assets, liabilities and equity at period end.',
                icon: alignBottom,
                path: `${paths.dashboard.accounting}/${paths.accounting.balanceSheet}`,
            },
            {
                key: 'cash-flow',
                title: 'Cash Flow',
                description: 'Cash from operating, investing and financing.',
                icon: moneys,
                path: `${paths.dashboard.accounting}/${paths.accounting.cashFlow}`,
            },
        ],
    },
    {
        key: 'analytics',
        heading: 'Analytics',
        items: [
            {
                key: 'expense-statement',
                title: 'Expense Statement',
                description: 'Transaction-level spend with category split and top vendors.',
                icon: graph,
                path: `${paths.dashboard.accounting}/${paths.accounting.expenseStatement}`,
            },
            {
                key: 'revenue-statement',
                title: 'Revenue Statement',
                description: 'Invoice-level revenue with category split and top customers.',
                icon: revenueGraph,
                path: `${paths.dashboard.accounting}/${paths.accounting.revenueStatement}`,
            },
        ],
    },
    {
        key: 'ledger',
        heading: 'Ledger reports',
        items: [
            {
                key: 'accounts-receivable',
                title: 'Accounts Receivable',
                description: 'Invoices raised and amounts due from customers.',
                icon: profile,
                path: `${paths.dashboard.accounting}/${paths.accounting.accountsReceivable}`,
            },
            {
                key: 'accounts-payable',
                title: 'Accounts Payable',
                description: 'Vendor bills and outstanding payment dues.',
                icon: card,
                path: `${paths.dashboard.accounting}/${paths.accounting.accountsPayable}`,
            },
        ],
    },
    {
        key: 'tax',
        heading: 'Tax & Compliance',
        items: [
            {
                key: 'gst-summary',
                title: 'GST Summary',
                description: 'Output tax, input credits and net GST payable.',
                icon: note,
                path: `${paths.dashboard.accounting}/${paths.accounting.gstSummary}`,
            },
        ],
    },
];
