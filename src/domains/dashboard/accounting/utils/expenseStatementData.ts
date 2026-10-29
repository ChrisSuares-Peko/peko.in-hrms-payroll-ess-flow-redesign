import { formatNumberWithLocalString } from '@utils/priceFormat';

import { FINANCIAL_YEARS, PERIOD_OPTIONS } from './reportFilters';

export const expenseStatementHeader = {
    title: 'Expense Statement',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export interface SelectOption {
    value: string;
    label: string;
}
export const periodOptions = PERIOD_OPTIONS;

export interface ExpenseCategory {
    key: string;
    label: string;
    color: string;
}
export const expenseCategories: ExpenseCategory[] = [
    { key: 'salaries', label: 'Salaries', color: '#FF4F4F' },
    { key: 'rent', label: 'Rent', color: '#F59E0B' },
    { key: 'professional-fees', label: 'Professional Fees', color: '#8B5CF6' },
    { key: 'marketing', label: 'Marketing', color: '#3B82F6' },
    { key: 'software', label: 'Software Subscription', color: '#06B6D4' },
    { key: 'travel', label: 'Travel', color: '#10B981' },
    { key: 'utilities', label: 'Utilities', color: '#EC4899' },
    { key: 'maintenance', label: 'Maintenance', color: '#F97316' },
    { key: 'office-supplies', label: 'Office Supplies', color: '#A855F7' },
];
const categoryByKey: Record<string, ExpenseCategory> = expenseCategories.reduce<
    Record<string, ExpenseCategory>
>((acc, c) => {
    acc[c.key] = c;
    return acc;
}, {});
export const getCategory = (key: string): ExpenseCategory =>
    categoryByKey[key] ?? { key, label: key, color: '#94A3B8' };

export const categoryFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All categories' },
    ...expenseCategories.map(c => ({ value: c.key, label: c.label })),
];
export const methodFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All methods' },
    { value: 'bank-transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'credit-card', label: 'Credit Card' },
    { value: 'auto-debit', label: 'Auto Debit' },
];
export const searchPlaceholder = 'Search vendor, category...';

export interface Transaction {
    date: string;
    vendor: string;
    categoryKey: string;
    subcategory: string;
    amount: number;
    method: string;
    reference: string;
}

export const transactionColumns: string[] = [
    'Date',
    'Vendor / Description',
    'Category',
    'Subcategory',
    'Amount',
    'Payment Method',
    'Reference',
];

export const transactionsTitle = 'Transactions';

export const formatRupee = (n: number): string => `₹${formatNumberWithLocalString(n)}`;
export const formatCompact = (n: number): string => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(2).replace(/\.?0+$/, '')}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
};

export interface CategorySlice {
    key: string;
    label: string;
    color: string;
    amount: number;
    pct: number;
    display: string;
}
export const distributionTitle = 'Category Distribution';
export const distributionCenterLabel = 'Total Spend';

export interface TrendPoint {
    label: string;
    value: number;
}
export const expenseTrendTitle = 'Outstanding Payables Trend';
export const TREND_COLOR = '#3B82F6';

export interface VendorSpend {
    vendor: string;
    amount: number;
    display: string;
    pct: number;
    categoryKey: string;
    color: string;
}
export const topVendorsTitle = 'Top Vendors by Spend';
