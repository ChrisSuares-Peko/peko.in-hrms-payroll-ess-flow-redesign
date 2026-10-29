import dayjs from 'dayjs';

import {
    BarLineChartData,
    dashboardColors,
    FilingCalendarData,
    PnlSummaryData,
} from './insightsDashboardData';
import { fiscalQuarterLabel, formatPct, formatRupee, niceTicks, toLakhs } from './reportFormat';
import { GstMonthlyPoint, GstReturn, GstSummary } from '../api/reports';

const rangeLabel = (range: { from: string; to: string }): string =>
    `${dayjs(range.from).format('MMM YYYY')} – ${dayjs(range.to).format('MMM YYYY')}`;

interface QuarterBucket {
    label: string;
    months: string[];
    outputGst: number;
    itc: number;
    netPayable: number;
}

const groupByQuarter = (monthly: GstMonthlyPoint[]): QuarterBucket[] => {
    const map = new Map<string, QuarterBucket>();
    monthly.forEach(m => {
        const label = fiscalQuarterLabel(m.month);
        const bucket = map.get(label) ?? {
            label,
            months: [],
            outputGst: 0,
            itc: 0,
            netPayable: 0,
        };
        bucket.months.push(m.month);
        bucket.outputGst += m.outputGst;
        bucket.itc += m.itc;
        bucket.netPayable += m.netPayable;
        map.set(label, bucket);
    });
    return [...map.values()];
};

const filingItem = (r: GstReturn) => {
    const period = dayjs(`${r.period}-01`).format('MMM YYYY');
    const detail =
        r.status === 'filed' && r.filedOn
            ? `Filed ${dayjs(r.filedOn).format('D MMM YYYY')}`
            : `Due ${dayjs(r.dueDate).format('D MMM YYYY')}`;
    return {
        key: `${r.type}-${r.period}`,
        title: r.type,
        subtitle: `${period} · ${detail}`,
        status: r.status,
    };
};

export const toTaxView = (gst: GstSummary) => {
    const { totals } = gst;
    const quarters = groupByQuarter(gst.monthly ?? []);

    const peak = quarters.reduce(
        (mx, q) => Math.max(mx, toLakhs(q.outputGst), toLakhs(q.itc), toLakhs(q.netPayable)),
        0
    );

    const gstOverview: BarLineChartData = {
        title: 'GST Overview',
        subtitle: 'Output GST vs ITC by quarter',
        ticks: niceTicks(peak),
        xKey: 'period',
        xSubKey: 'range',
        bars: [
            { dataKey: 'outputGst', color: dashboardColors.expenseBar },
            { dataKey: 'itc', color: dashboardColors.revenueBar },
        ],
        line: { dataKey: 'netPayable', color: dashboardColors.netProfitLine },
        points: quarters.map(q => ({
            period: q.label.split(' ')[0],
            range: `${dayjs(`${q.months[0]}-01`).format('MMM')}–${dayjs(
                `${q.months[q.months.length - 1]}-01`
            ).format('MMM')}`,
            outputGst: toLakhs(q.outputGst),
            itc: toLakhs(q.itc),
            netPayable: toLakhs(q.netPayable),
        })),
    };

    const summary: PnlSummaryData = {
        title: 'GST Summary',
        subtitle: rangeLabel(gst.range),
        rows: [
            {
                label: 'Total Taxable Turnover',
                value: formatRupee(totals.taxableTurnover),
                tone: 'success',
            },
            {
                label: 'Output GST Collected',
                value: `(${formatRupee(totals.outputGst)})`,
                tone: 'danger',
            },
            { label: 'Input Tax Credit (ITC)', value: formatRupee(totals.itc), tone: 'success' },
        ],
        total: {
            label: 'Net GST Payable',
            value: formatRupee(totals.netPayable),
            tone: totals.netPayable > 0 ? 'danger' : 'success',
        },
        footer: { label: 'ITC Utilisation Rate', value: formatPct(totals.itcUtilisationPct) },
    };

    const filing: FilingCalendarData = {
        title: 'Filing Calendar',
        subtitle: 'GST return status',
        items: (gst.filing.returns ?? []).map(filingItem),
    };

    return { gstOverview, summary, filing };
};
