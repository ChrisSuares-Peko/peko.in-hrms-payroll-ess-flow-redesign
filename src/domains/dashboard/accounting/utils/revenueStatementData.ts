import { FINANCIAL_YEARS, PERIOD_OPTIONS } from './reportFilters';

export interface RevenueCategory {
    key: string;
    label: string;
    color: string;
}

export const revenueCategories: RevenueCategory[] = [
    { key: 'fabric', label: 'Product Sales — Fabric', color: '#F59E0B' },
    { key: 'stitching', label: 'Service Income — Stitching', color: '#FF4F4F' },
    { key: 'readymade', label: 'Product Sales — Readymade', color: '#22C55E' },
    { key: 'yarn', label: 'Product Sales — Yarn', color: '#3B82F6' },
    { key: 'consulting', label: 'Consulting Income', color: '#06B6D4' },
    { key: 'subscription', label: 'Subscription Revenue', color: '#EC4899' },
    { key: 'finishing', label: 'Service Income — Finishing', color: '#8B5CF6' },
    { key: 'other', label: 'Other Operating Income', color: '#84CC16' },
];

export const categoryColor = (label: string): string =>
    revenueCategories.find(category => category.label === label)?.color ?? '#94A3B8';

export const revenueStatementHeader = {
    title: 'Revenue Statement',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export interface SelectOption {
    value: string;
    label: string;
}

export const periodOptions = PERIOD_OPTIONS;

export const invoiceSearchPlaceholder = 'Search customer, invoice';

export const customerFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All customer' },
    { value: 'raj-spinners', label: 'Raj Spinners Pvt Ltd' },
    { value: 'anand', label: 'Anand Fabricators' },
    { value: 'surya', label: 'Surya Textiles' },
];

export const categoryFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All categories' },
    ...revenueCategories.map(category => ({ value: category.key, label: category.label })),
];

export const methodFilterOptions: SelectOption[] = [
    { value: 'all', label: 'All method' },
    { value: 'bank-transfer', label: 'Bank Transfer' },
    { value: 'neft', label: 'NEFT' },
    { value: 'upi', label: 'UPI' },
];

export const invoiceColumns: string[] = [
    'Date',
    'Customer',
    'Invoice No.',
    'Revenue Category',
    'Amount',
    'Payment Method',
    'Reference',
];

export interface RevenueInvoice {
    id: string;
    date: string;
    customer: string;
    invoiceNo: string;
    category: string;
    amount: number;
    method: string;
    reference: string;
}

export interface CategorySlice {
    key: string;
    label: string;
    color: string;
    display: string;
    percent: number;
}

export interface TrendPoint {
    period: string;
    value: number;
}

export interface CustomerRevenue {
    key: string;
    name: string;
    display: string;
    percent: number;
    color: string;
}
