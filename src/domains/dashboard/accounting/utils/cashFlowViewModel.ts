import {
    CapexItem,
    CfBalancePoint,
    CfCategory,
    CfRow,
    CfSection,
    CfStat,
    CfTone,
    CfTrendPoint,
    FINANCING_COLOR,
    INVESTING_COLOR,
    OPERATING_COLOR,
} from './cashFlowData';
import {
    fiscalQuarterLabel,
    formatCompact,
    monthLabel,
    signedCompact,
    toLakhs,
} from './reportFormat';
import {
    CashFlowOverview,
    CashFlowOverviewMetric,
    CashFlowSectionKey,
    CashFlowStatement,
    CashFlowStatementSection,
    FreeCashFlow,
} from '../api/reports';

// Section identity fixes the color/tone the statement renders.
const TONE_BY_KEY: Record<CashFlowSectionKey, CfTone> = {
    operating: 'success',
    investing: 'danger',
    financing: 'warning',
};

// The backend sometimes sends the closing total row with a missing/"unknown"
// head — that row is the period's total assets, so label it accordingly.
const rowLabel = (head: string): string => {
    const value = (head ?? '').trim();
    return !value || value.toLowerCase() === 'unknown' ? 'TOTAL ASSETS' : value;
};

const toSection = (s: CashFlowStatementSection): CfSection => ({
    id: s.key,
    title: s.title,
    tone: TONE_BY_KEY[s.key] ?? 'success',
    rows: s.lineItems.map<CfRow>(li => ({
        label: rowLabel(li.head),
        amount: li.amount,
        isSubheading: li.isSubheading,
    })),
    net: { label: s.net.label, amount: s.net.amount },
});

export interface CashFlowSummaryBoxData {
    rows: { label: string; amount: number }[];
    closing: { label: string; amount: number };
}

export const toCashFlowStatementView = (d: CashFlowStatement) => ({
    sections: d.sections.map(toSection),
    summaryBox: {
        rows: [
            { label: 'Opening Cash Balance', amount: d.summary.openingBalance },
            { label: 'Net Cash Flow (A+B+C)', amount: d.summary.netCashFlow },
        ],
        closing: { label: 'Closing Cash Balance', amount: d.summary.closingBalance },
    } as CashFlowSummaryBoxData,
});

export type CashFlowStatementView = ReturnType<typeof toCashFlowStatementView>;

const deltaLabel = (deltaPercent: number | null): string =>
    deltaPercent == null ? '—' : `${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`;

const toStat = (key: string, label: string, m: CashFlowOverviewMetric): CfStat => ({
    key,
    label,
    value: signedCompact(m.value),
    delta: deltaLabel(m.deltaPercent),
    up: m.up,
});

const toTrendMonthly = (points: CashFlowOverview['trend']): CfTrendPoint[] =>
    points.map(p => ({
        label: monthLabel(p.month),
        operating: toLakhs(p.operating),
        investing: toLakhs(p.investing),
        financing: toLakhs(p.financing),
    }));

// Trend lines are flows, so a fiscal quarter sums its three months.
const toTrendQuarterly = (points: CashFlowOverview['trend']): CfTrendPoint[] => {
    const order: string[] = [];
    const byQuarter = new Map<
        string,
        { operating: number; investing: number; financing: number }
    >();
    points.forEach(p => {
        const q = fiscalQuarterLabel(p.month);
        if (!byQuarter.has(q)) {
            order.push(q);
            byQuarter.set(q, { operating: 0, investing: 0, financing: 0 });
        }
        const cur = byQuarter.get(q)!;
        cur.operating += p.operating;
        cur.investing += p.investing;
        cur.financing += p.financing;
    });
    return order.map(q => {
        const v = byQuarter.get(q)!;
        return {
            label: q,
            operating: toLakhs(v.operating),
            investing: toLakhs(v.investing),
            financing: toLakhs(v.financing),
        };
    });
};

const toBalanceMonthly = (points: CashFlowOverview['balanceProgression']): CfBalancePoint[] =>
    points.map(p => ({ label: monthLabel(p.month), balance: toLakhs(p.balance) }));

// Balance is a snapshot, so a fiscal quarter takes its last month's value.
const toBalanceQuarterly = (points: CashFlowOverview['balanceProgression']): CfBalancePoint[] => {
    const order: string[] = [];
    const byQuarter = new Map<string, CfBalancePoint>();
    points.forEach(p => {
        const q = fiscalQuarterLabel(p.month);
        if (!byQuarter.has(q)) order.push(q);
        byQuarter.set(q, { label: q, balance: toLakhs(p.balance) });
    });
    return order.map(q => byQuarter.get(q)!);
};

const toCategory = (label: string, m: CashFlowOverviewMetric, color: string): CfCategory => ({
    label,
    value: toLakhs(m.value),
    display: signedCompact(m.value),
    color,
});

export const toCashFlowOverviewView = (d: CashFlowOverview) => ({
    stats: [
        toStat('operating', 'OPERATING CF', d.summary.operating),
        toStat('investing', 'INVESTING CF', d.summary.investing),
        toStat('financing', 'FINANCING CF', d.summary.financing),
        toStat('net', 'NET CASH FLOW', d.summary.netCashFlow),
        toStat('closing', 'CLOSING BALANCE', d.summary.closingBalance),
    ] as CfStat[],
    trendMonthly: toTrendMonthly(d.trend),
    trendQuarterly: toTrendQuarterly(d.trend),
    // CF Category Comparison is derived from the summary activity nets.
    categoryItems: [
        toCategory('Operating', d.summary.operating, OPERATING_COLOR),
        toCategory('Investing', d.summary.investing, INVESTING_COLOR),
        toCategory('Financing', d.summary.financing, FINANCING_COLOR),
    ] as CfCategory[],
    balanceMonthly: toBalanceMonthly(d.balanceProgression),
    balanceQuarterly: toBalanceQuarterly(d.balanceProgression),
});

export type CashFlowOverviewView = ReturnType<typeof toCashFlowOverviewView>;

export const toFreeCashFlowView = (d: FreeCashFlow) => ({
    fcf: {
        value: signedCompact(d.freeCashFlow.value),
        negative: d.freeCashFlow.value < 0,
        note:
            d.freeCashFlow.pctOfOperating == null
                ? ''
                : `${d.freeCashFlow.pctOfOperating}% of Operating CF`,
    },
    capex: {
        value: formatCompact(d.capex.total),
        items: d.capex.items.map<CapexItem>(it => ({
            label: it.label,
            display: formatCompact(it.amount),
            pct: it.percent,
        })),
    },
    capexRatio: {
        value: d.capexRatio.value ?? 0,
        display: d.capexRatio.value == null ? '—' : `${d.capexRatio.value}%`,
    },
});

export type FreeCashFlowView = ReturnType<typeof toFreeCashFlowView>;
