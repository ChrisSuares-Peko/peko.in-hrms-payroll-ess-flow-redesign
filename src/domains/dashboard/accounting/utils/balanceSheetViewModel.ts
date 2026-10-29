import dayjs from 'dayjs';

import {
    ASSET_COLOR,
    BalanceStat,
    BsColumn,
    BsRow,
    BsTrendPoint,
    CompositionSlice,
    EQUITY_COLOR,
    InsightTile,
    LIABILITY_COLOR,
    OverviewDonut,
    WcMetric,
} from './balanceSheetData';
import {
    fiscalQuarterLabel,
    formatCompact,
    monthLabel,
    reportColor,
    toLakhs,
} from './reportFormat';
import {
    BalanceSheet,
    BalanceSheetCompositionItem,
    BalanceSheetLineItem,
    BalanceSheetRatio,
} from '../api/reports';

const asOfLabel = (asOf: string): string => `As of ${dayjs(asOf).format('DD MMM YYYY')}`;

// API may send null for percentages that can't be computed; treat those as 0 for display.
const num = (n: number | null | undefined): number => n ?? 0;

const capitalize = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// API tones (e.g. "healthy" | "moderate" | "high") map to the two-tone Tag the cards render.
const toneToStatus = (tone: string): { tone: WcMetric['tone']; status: string } => ({
    tone: tone === 'healthy' ? 'success' : 'warning',
    status: capitalize(tone),
});

const toItemRow = (item: BalanceSheetLineItem): BsRow => ({
    label: item.head,
    amount: item.amount,
});

const toSlices = (items: BalanceSheetCompositionItem[]): CompositionSlice[] =>
    items.map((item, i) => ({
        label: item.label,
        value: item.amount,
        display: formatCompact(item.amount),
        pct: `${num(item.percent)}%`,
        color: reportColor(i),
    }));

const toMonthlyTrend = (points: BalanceSheet['trend']): BsTrendPoint[] =>
    points.map(p => ({
        label: monthLabel(p.month),
        assets: toLakhs(p.assets),
        liabilities: toLakhs(p.liabilities),
        equity: toLakhs(p.equity),
    }));

// Balances are point-in-time snapshots, so each fiscal quarter takes its last month's values.
const toQuarterlyTrend = (points: BalanceSheet['trend']): BsTrendPoint[] => {
    const order: string[] = [];
    const byQuarter = new Map<string, BsTrendPoint>();
    points.forEach(p => {
        const q = fiscalQuarterLabel(p.month);
        if (!byQuarter.has(q)) order.push(q);
        byQuarter.set(q, {
            label: q,
            assets: toLakhs(p.assets),
            liabilities: toLakhs(p.liabilities),
            equity: toLakhs(p.equity),
        });
    });
    return order.map(q => byQuarter.get(q)!);
};

export const toBalanceSheetView = (d: BalanceSheet) => {
    const { summary, statement, workingCapitalAnalysis: wca } = d;

    const summaryStats: BalanceStat[] = [
        {
            key: 'assets',
            label: 'Total assets',
            value: formatCompact(summary.totalAssets),
            caption: asOfLabel(d.asOf),
            bg: '#F8FAFC',
            border: '#CBD5E1',
        },
        {
            key: 'liabilities',
            label: 'Total liabilities',
            value: formatCompact(summary.totalLiabilities),
            caption: `${num(summary.liabilitiesPctOfAssets)}% of assets`,
            bg: '#FEF2F2',
            border: '#FF4F4F',
            valueColor: LIABILITY_COLOR,
        },
        {
            key: 'equity',
            label: 'Total equity',
            value: formatCompact(summary.totalEquity),
            caption: `${num(summary.equityPctOfAssets)}% of assets`,
            bg: '#FFFBEB',
            border: '#FCD34D',
        },
        {
            key: 'working-capital',
            label: 'Working capital',
            value: formatCompact(summary.workingCapital),
            caption: `${capitalize(summary.workingCapitalTone)} buffer`,
            bg: '#ECFDF5',
            border: '#81CF92',
            valueColor: ASSET_COLOR,
        },
    ];

    const assets: BsColumn = {
        title: 'Assets',
        sections: [
            {
                heading: 'CURRENT ASSETS',
                rows: [
                    ...statement.assets.currentAssets.map(toItemRow),
                    {
                        label: 'Total Current Assets',
                        amount: statement.assets.totalCurrentAssets,
                        kind: 'subtotal',
                        tone: 'success',
                    },
                ],
            },
            {
                heading: 'NON-CURRENT ASSETS',
                rows: [
                    ...statement.assets.nonCurrentAssets.map(toItemRow),
                    {
                        label: 'Total Non-Current Assets',
                        amount: statement.assets.totalNonCurrentAssets,
                        kind: 'subtotal',
                        tone: 'success',
                    },
                ],
            },
        ],
        total: {
            label: 'TOTAL ASSETS',
            amount: statement.assets.totalAssets,
            kind: 'total',
            tone: 'success',
        },
    };

    const le = statement.liabilitiesAndEquity;
    const liabilities: BsColumn = {
        title: 'Liabilities & Equity',
        sections: [
            {
                heading: 'CURRENT LIABILITIES',
                rows: [
                    ...le.currentLiabilities.map(toItemRow),
                    {
                        label: 'Total Current Liabilities',
                        amount: le.totalCurrentLiabilities,
                        kind: 'subtotal',
                        tone: 'error',
                    },
                ],
            },
            {
                heading: 'LONG-TERM LIABILITIES',
                rows: [
                    ...le.longTermLiabilities.map(toItemRow),
                    {
                        label: 'Total Long-Term Liabilities',
                        amount: le.totalLongTermLiabilities,
                        kind: 'subtotal',
                        tone: 'error',
                    },
                ],
            },
            {
                heading: 'EQUITY',
                rows: [
                    ...le.equity.map(toItemRow),
                    {
                        label: 'Total Equity',
                        amount: le.totalEquity,
                        kind: 'subtotal',
                        tone: 'success',
                    },
                ],
            },
        ],
        total: {
            label: 'TOTAL LIABILITIES + EQUITY',
            amount: le.totalLiabilitiesAndEquity,
            kind: 'total',
            tone: 'success',
        },
    };

    // Assets = Liabilities + Equity, so the ring shows how assets are financed
    // (liabilities vs equity) and the center total is total assets.
    const overviewDonut: OverviewDonut = {
        centerLabel: 'Total Value',
        centerValue: formatCompact(summary.totalAssets),
        slices: [
            {
                label: 'Total Liabilities',
                value: num(summary.liabilitiesPctOfAssets),
                display: formatCompact(summary.totalLiabilities),
                pct: `${num(summary.liabilitiesPctOfAssets)}%`,
                color: LIABILITY_COLOR,
            },
            {
                label: 'Total equity',
                value: num(summary.equityPctOfAssets),
                display: formatCompact(summary.totalEquity),
                pct: `${num(summary.equityPctOfAssets)}%`,
                color: EQUITY_COLOR,
            },
        ],
    };

    const ratioMetric = (
        label: string,
        ratio: BalanceSheetRatio,
        opts?: { highlight?: boolean; money?: boolean }
    ): WcMetric => {
        const { tone, status } = toneToStatus(ratio.tone);
        let value = '—';
        if (ratio.value != null) {
            value = opts?.money ? formatCompact(ratio.value) : ratio.value.toFixed(2);
        }
        return {
            label,
            value,
            status,
            tone,
            ...(opts?.highlight ? { highlight: true } : {}),
        };
    };

    const metrics: WcMetric[] = [
        ratioMetric('Working Capital', wca.workingCapital, { highlight: true, money: true }),
        ratioMetric('Current Ratio', wca.currentRatio),
        ratioMetric('Quick Ratio', wca.quickRatio),
        ratioMetric('Debt-to-Equity', wca.debtToEquity),
    ];

    const caVs = wca.currentAssetsVsCurrentLiabilities;
    const caClTotal = num(caVs.currentAssets) + num(caVs.currentLiabilities);
    const pct = (v: number) => (caClTotal > 0 ? Math.round((num(v) / caClTotal) * 100) : 0);

    return {
        summaryStats,
        statement: { assets, liabilities },
        overviewDonut,
        workingCapital: {
            metrics,
            currentAssets: {
                display: formatCompact(caVs.currentAssets),
                pct: pct(caVs.currentAssets),
            },
            currentLiabilities: {
                display: formatCompact(caVs.currentLiabilities),
                pct: pct(caVs.currentLiabilities),
            },
        },
        assetComposition: {
            centerValue: formatCompact(summary.totalAssets),
            slices: toSlices(d.assetComposition),
        },
        liabilityComposition: {
            centerValue: formatCompact(summary.totalLiabilities),
            slices: toSlices(d.liabilityComposition),
        },
        trendMonthly: toMonthlyTrend(d.trend),
        trendQuarterly: toQuarterlyTrend(d.trend),
        insights: d.insights.map(i => ({
            key: i.key,
            title: i.title,
            text: i.text,
        })) as InsightTile[],
    };
};

export type BalanceSheetView = ReturnType<typeof toBalanceSheetView>;
