import { formatNumberWithLocalString } from '@utils/priceFormat';

import { FINANCIAL_YEARS, PERIOD_OPTIONS, REPORT_STATUS_OPTIONS } from './reportFilters';

export const accountsPayableHeader = {
    title: 'Accounts Payable',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export interface SelectOption {
    value: string;
    label: string;
}
export const periodOptions = PERIOD_OPTIONS;
export const statusOptions = REPORT_STATUS_OPTIONS;

export type BillStatus = 'paid' | 'unpaid' | 'partial' | 'overdue';

export interface Bill {
    vendor: string;
    issuedLabel: string;
    billNo: string;
    billDate: string;
    dueDate: string;
    amount: number;
    paid: number;
    outstanding: number;
    status: BillStatus;
    pastDue?: boolean;
}

export const bills: Bill[] = [
    {
        vendor: 'Office Rent — Landlord',
        issuedLabel: '01 Jan 2026',
        billNo: 'BILL-098',
        billDate: '01 Jan 2026',
        dueDate: '15 Mar 2026',
        amount: 120000,
        paid: 120000,
        outstanding: 0,
        status: 'paid',
    },
    {
        vendor: 'Raj Spinners Pvt Ltd',
        issuedLabel: '12 Jan 2026',
        billNo: 'BILL-101',
        billDate: '12 Jan 2026',
        dueDate: '26 Mar 2026',
        amount: 95000,
        paid: 0,
        outstanding: 95000,
        status: 'unpaid',
    },
    {
        vendor: 'Patel Textiles',
        issuedLabel: '20 Jan 2026',
        billNo: 'BILL-104',
        billDate: '20 Jan 2026',
        dueDate: '05 Apr 2026',
        amount: 160000,
        paid: 80000,
        outstanding: 80000,
        status: 'partial',
    },
    {
        vendor: 'Anand Mills Ltd',
        issuedLabel: '28 Dec 2025',
        billNo: 'BILL-107',
        billDate: '28 Dec 2025',
        dueDate: '28 Feb 2026',
        amount: 140000,
        paid: 0,
        outstanding: 140000,
        status: 'overdue',
        pastDue: true,
    },
    {
        vendor: 'Surya Fabrics',
        issuedLabel: '05 Feb 2026',
        billNo: 'BILL-110',
        billDate: '05 Feb 2026',
        dueDate: '20 Apr 2026',
        amount: 72000,
        paid: 72000,
        outstanding: 0,
        status: 'paid',
    },
    {
        vendor: 'Raj Spinners Pvt Ltd',
        issuedLabel: '10 Feb 2026',
        billNo: 'BILL-113',
        billDate: '10 Feb 2026',
        dueDate: '25 Apr 2026',
        amount: 88000,
        paid: 0,
        outstanding: 88000,
        status: 'unpaid',
    },
    {
        vendor: 'Patel Textiles',
        issuedLabel: '18 Nov 2025',
        billNo: 'BILL-116',
        billDate: '18 Nov 2025',
        dueDate: '18 Jan 2026',
        amount: 65000,
        paid: 20000,
        outstanding: 45000,
        status: 'overdue',
        pastDue: true,
    },
    {
        vendor: 'Kiran Exports',
        issuedLabel: '22 Feb 2026',
        billNo: 'BILL-119',
        billDate: '22 Feb 2026',
        dueDate: '08 May 2026',
        amount: 54000,
        paid: 0,
        outstanding: 54000,
        status: 'unpaid',
    },
];

export const billColumns: string[] = [
    'Vendor',
    'Bill No.',
    'Bill Date',
    'Due Date',
    'Bill Amount',
    'Paid',
    'Outstanding',
    'Status',
];

export interface BillTotals {
    amount: number;
    paid: number;
    outstanding: number;
    count: number;
}
export const billTotals: BillTotals = bills.reduce<BillTotals>(
    (acc, bill) => ({
        amount: acc.amount + bill.amount,
        paid: acc.paid + bill.paid,
        outstanding: acc.outstanding + bill.outstanding,
        count: acc.count + 1,
    }),
    { amount: 0, paid: 0, outstanding: 0, count: 0 }
);

export const billsTotalLabel = `Totals (${billTotals.count} bills)`;

export const vendorBillsTitle = 'Vendor Bills';

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
    vendor: string;
    d0_30: number;
    d31_60: number;
    d61_90: number;
    d90: number;
}
export const agingRows: AgingRow[] = [
    { vendor: 'Raj Spinners Pvt Ltd', d0_30: 95000, d31_60: 88000, d61_90: 0, d90: 0 },
    { vendor: 'Patel Textiles', d0_30: 80000, d31_60: 0, d61_90: 0, d90: 45000 },
    { vendor: 'Anand Mills Ltd', d0_30: 0, d31_60: 0, d61_90: 140000, d90: 0 },
    { vendor: 'Kiran Exports', d0_30: 54000, d31_60: 0, d61_90: 0, d90: 0 },
];

export const agingRowTotal = (row: AgingRow): number =>
    row.d0_30 + row.d31_60 + row.d61_90 + row.d90;

export type AgingTotals = Record<AgingBucketKey, number>;
export const agingTotals: AgingTotals = agingRows.reduce<AgingTotals>(
    (acc, row) => ({
        d0_30: acc.d0_30 + row.d0_30,
        d31_60: acc.d31_60 + row.d31_60,
        d61_90: acc.d61_90 + row.d61_90,
        d90: acc.d90 + row.d90,
    }),
    { d0_30: 0, d31_60: 0, d61_90: 0, d90: 0 }
);

export const agingTitle = 'Aging Analysis';
export const agingVendorHeader = 'Vendor';
export const agingTotalHeader = 'Total';
export const agingTotalsRowLabel = 'Totals';
export const agingOutstandingTag = '₹5.0L outstanding';

export interface TrendPoint {
    month: string;
    value: number;
}
export const outstandingPayablesTrendTitle = 'Outstanding Payables Trend';
export const outstandingPayablesTrend: TrendPoint[] = [
    { month: 'Apr', value: 0.8 },
    { month: 'May', value: 1.1 },
    { month: 'Jun', value: 1.5 },
    { month: 'Jul', value: 1.9 },
    { month: 'Aug', value: 2.3 },
    { month: 'Sep', value: 2.7 },
    { month: 'Oct', value: 3.2 },
    { month: 'Nov', value: 3.6 },
    { month: 'Dec', value: 4.0 },
    { month: 'Jan', value: 4.4 },
    { month: 'Feb', value: 4.7 },
    { month: 'Mar', value: 5.0 },
];
export const TREND_COLOR = '#3B82F6';

export type DistributionTone = 'danger' | 'warning' | 'neutral';
export interface DistributionBar {
    vendor: string;
    amount: number;
    display: string;
    pct: number;
    tone: DistributionTone;
}
export const distributionTitle = 'Vendor Payable Distribution';
export const vendorDistribution: DistributionBar[] = [
    {
        vendor: 'Raj Spinners Pvt Ltd',
        amount: 183000,
        display: '₹1.83L',
        pct: 100,
        tone: 'neutral',
    },
    { vendor: 'Anand Mills Ltd', amount: 140000, display: '₹1.40L', pct: 76.5, tone: 'danger' },
    { vendor: 'Patel Textiles', amount: 125000, display: '₹1.25L', pct: 68.3, tone: 'warning' },
    { vendor: 'Kiran Exports', amount: 54000, display: '₹54.0K', pct: 29.5, tone: 'neutral' },
];
export interface DistributionLegendItem {
    label: string;
    tone: DistributionTone;
}
export const distributionLegend: DistributionLegendItem[] = [
    { label: 'Overdue', tone: 'danger' },
    { label: 'Partial', tone: 'warning' },
    { label: 'Pending', tone: 'neutral' },
];

export type StatTone = 'success' | 'warning' | 'danger';
export interface PaymentStat {
    key: string;
    label: string;
    value: string;
    caption: string;
    tone: StatTone;
}
export const paymentSummaryTitle = 'Payment Obligations Summary';
export const paymentStats: PaymentStat[] = [
    {
        key: 'rate',
        label: 'Payment Rate',
        value: '36.8%',
        caption: 'of total billed',
        tone: 'danger',
    },
    {
        key: 'avg-days',
        label: 'Avg Days Payable',
        value: '39 days',
        caption: 'average payment period',
        tone: 'warning',
    },
    {
        key: 'overdue',
        label: 'Overdue Amount',
        value: '₹1.85L',
        caption: 'past due date',
        tone: 'danger',
    },
    {
        key: 'due',
        label: 'Due (30 Days)',
        value: '₹3.17L',
        caption: 'due within 30 days',
        tone: 'success',
    },
];

export interface BreakdownSegment {
    label: string;
    amount: number;
    pct: number;
    tone: StatTone;
}
export const breakdownTitle = 'Total Payables Breakdown';
export const breakdownSegments: BreakdownSegment[] = [
    { label: 'Paid', amount: 292000, pct: 36.8, tone: 'success' },
    { label: 'Outstanding', amount: 317000, pct: 39.9, tone: 'warning' },
    { label: 'Overdue', amount: 185000, pct: 23.3, tone: 'danger' },
];
export const breakdownTotal = billTotals.amount;

export const formatRupee = (n: number): string =>
    `₹${formatNumberWithLocalString(n)}`;
