import { FINANCIAL_YEARS } from './reportFilters';

export const gstSummaryHeader = {
    title: 'GST Summary Report',
    exportLabel: 'Export',
};

export const financialYears = FINANCIAL_YEARS;

export const companyInfo = {
    fallbackName: 'Rahul Textiles Pvt. Ltd.',
    gstin: '27AADCR1234M1ZP',
    pan: 'AADCR1234M',
    period: 'FY 2025–26 · Full Year (Apr–Mar)',
    currencyNote: 'All amounts in Indian Rupees (₹)',
};

export interface GstRateRow {
    rate: number;
    taxable: number;
    outputGst: number;
    itc: number;
    cgst: number;
    sgst: number;
    igst: number;
    netPayable: number;
}

export const gstRateRows: GstRateRow[] = [
    { rate: 0, taxable: 200000, outputGst: 0, itc: 0, cgst: 0, sgst: 0, igst: 0, netPayable: 0 },
    {
        rate: 5,
        taxable: 300000,
        outputGst: 15000,
        itc: 6000,
        cgst: 7500,
        sgst: 7500,
        igst: 0,
        netPayable: 9000,
    },
    {
        rate: 12,
        taxable: 300000,
        outputGst: 36000,
        itc: 16000,
        cgst: 14000,
        sgst: 14000,
        igst: 8000,
        netPayable: 20000,
    },
    {
        rate: 18,
        taxable: 500000,
        outputGst: 90000,
        itc: 55000,
        cgst: 30000,
        sgst: 30000,
        igst: 30000,
        netPayable: 35000,
    },
    {
        rate: 28,
        taxable: 245000,
        outputGst: 68600,
        itc: 28140,
        cgst: 24300,
        sgst: 24300,
        igst: 20000,
        netPayable: 40460,
    },
];

export interface GstColumn {
    key: keyof Omit<GstRateRow, 'rate'>;
    label: string;
}
export const gstRateColumns: GstColumn[] = [
    { key: 'taxable', label: 'Taxable Amount' },
    { key: 'outputGst', label: 'Output GST' },
    { key: 'itc', label: 'Input Tax Credit' },
    { key: 'cgst', label: 'CGST' },
    { key: 'sgst', label: 'SGST' },
    { key: 'igst', label: 'IGST' },
    { key: 'netPayable', label: 'Net Payable' },
];

export type GstTotals = Omit<GstRateRow, 'rate'>;

export const gstRateTotals: GstTotals = gstRateRows.reduce<GstTotals>(
    (acc, row) => ({
        taxable: acc.taxable + row.taxable,
        outputGst: acc.outputGst + row.outputGst,
        itc: acc.itc + row.itc,
        cgst: acc.cgst + row.cgst,
        sgst: acc.sgst + row.sgst,
        igst: acc.igst + row.igst,
        netPayable: acc.netPayable + row.netPayable,
    }),
    { taxable: 0, outputGst: 0, itc: 0, cgst: 0, sgst: 0, igst: 0, netPayable: 0 }
);

export const gstRateBreakupTitle = 'GST Rate-wise Breakup';

export const gstRateTableLabels = {
    rateHeader: 'Tax Rate',
    totalRow: 'Total',
};

export interface GstStat {
    key: string;
    label: string;
    value: number;
    highlight?: boolean;
}
export const gstSummaryStats: GstStat[] = [
    { key: 'taxable', label: 'Taxable Turnover', value: gstRateTotals.taxable },
    { key: 'output', label: 'Output GST', value: gstRateTotals.outputGst },
    { key: 'itc', label: 'Input Tax Credit', value: gstRateTotals.itc },
    {
        key: 'net',
        label: 'Net GST Payable',
        value: gstRateTotals.netPayable,
        highlight: true,
    },
];

export const gstr3bBanner = {
    title: 'GSTR-3B Filing Due',
    dueDate: '20th April 2026',
    buildBody: (netPayableDisplay: string): string =>
        `Net GST Payable of ${netPayableDisplay} is due for GSTR-3B filing by 20th April 2026. ` +
        `Ensure input tax credits are reconciled with GSTR-2B before filing.`,
};
