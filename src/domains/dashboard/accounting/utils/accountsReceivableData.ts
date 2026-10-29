import { formatNumberWithLocalString } from '@utils/priceFormat';

import { FINANCIAL_YEARS, PERIOD_OPTIONS, REPORT_STATUS_OPTIONS } from './reportFilters';

export const accountsReceivableHeader = {
    title: 'Accounts Receivable',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export interface SelectOption {
    value: string;
    label: string;
}
export const periodOptions = PERIOD_OPTIONS;
export const statusOptions = REPORT_STATUS_OPTIONS;

export type InvoiceStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

export interface Invoice {
    customer: string;
    issuedLabel: string;
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    paid: number;
    outstanding: number;
    status: InvoiceStatus;
    pastDue?: boolean;
}

export const invoiceColumns: string[] = [
    'Customer',
    'Invoice No.',
    'Invoice Date',
    'Due Date',
    'Invoice Amount',
    'Paid',
    'Outstanding',
    'Status',
];

export interface InvoiceTotals {
    amount: number;
    paid: number;
    outstanding: number;
    count: number;
}

export type AgingBucketKey = 'd0_30' | 'd31_60' | 'd61_90' | 'd90';

export interface AgingColumn {
    key: AgingBucketKey;
    label: string;
    tone: 'success' | 'warning' | 'orange' | 'danger';
}
export const agingColumns: AgingColumn[] = [
    { key: 'd0_30', label: '0–30 Days', tone: 'success' },
    { key: 'd31_60', label: '31–60 Days', tone: 'warning' },
    { key: 'd61_90', label: '61–90 Days', tone: 'orange' },
    { key: 'd90', label: '90+ Days', tone: 'danger' },
];

export interface AgingRow {
    customer: string;
    d0_30: number;
    d31_60: number;
    d61_90: number;
    d90: number;
}

export const agingRowTotal = (row: AgingRow): number =>
    row.d0_30 + row.d31_60 + row.d61_90 + row.d90;

export type AgingTotals = Record<AgingBucketKey, number>;

export const agingTitle = 'Aging Analysis';

export interface TrendPoint {
    month: string;
    value: number;
}
export const outstandingTrendTitle = 'Outstanding Receivables Trend';
export const TREND_COLOR = '#3B82F6';

export type DistributionTone = 'danger' | 'warning' | 'neutral';
export interface DistributionBar {
    customer: string;
    amount: number;
    display: string;
    pct: number;
    tone: DistributionTone;
}
export const distributionTitle = 'Customer Receivable Distribution';
export interface DistributionLegendItem {
    label: string;
    tone: DistributionTone;
}
export const distributionLegend: DistributionLegendItem[] = [
    { label: 'Overdue', tone: 'danger' },
    { label: 'Partial', tone: 'warning' },
    { label: 'Unpaid', tone: 'neutral' },
];

export type StatTone = 'success' | 'warning' | 'danger';
export interface CollectionStat {
    key: string;
    label: string;
    value: string;
    caption: string;
    tone: StatTone;
}
export const collectionSummaryTitle = 'Collection Summary';

export interface BreakdownSegment {
    label: string;
    amount: number;
    pct: number;
    tone: StatTone;
}
export const breakdownTitle = 'Total Receivables Breakdown';

export const formatRupee = (n: number): string =>
    `₹${formatNumberWithLocalString(n)}`;
