import dayjs from 'dayjs';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { GstRateRow, GstStat, GstTotals } from './gstSummaryData';
import { GstRateBreakupRow, GstSummary } from '../api/reports';

const money = (n: number): string => `₹${formatNumberWithLocalString(n)}`;

const toRow = (r: GstRateBreakupRow): GstRateRow => ({
    rate: r.rate,
    taxable: r.taxable,
    outputGst: r.outputGst,
    itc: r.itc,
    cgst: r.cgst,
    sgst: r.sgst,
    igst: r.igst,
    netPayable: r.netPayable,
});

const sumTotals = (rows: GstRateRow[]): GstTotals =>
    rows.reduce<GstTotals>(
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

export const toGstSummaryView = (d: GstSummary) => {
    const rows = d.rateBreakup.map(toRow);
    const totals = sumTotals(rows);

    const stats: GstStat[] = [
        { key: 'taxable', label: 'Taxable Turnover', value: totals.taxable },
        { key: 'output', label: 'Output GST', value: totals.outputGst },
        { key: 'itc', label: 'Input Tax Credit', value: totals.itc },
        { key: 'net', label: 'Net GST Payable', value: totals.netPayable, highlight: true },
    ];

    const dueLabel = dayjs(d.filing.dueDate).format('D MMMM YYYY');
    const bannerBody =
        `Net GST Payable of ${money(totals.netPayable)} is due for GSTR-3B filing by ${dueLabel}. ` +
        `Ensure input tax credits are reconciled with GSTR-2B before filing.`;

    return {
        registration: d.registration,
        rows,
        totals,
        stats,
        bannerBody,
    };
};
