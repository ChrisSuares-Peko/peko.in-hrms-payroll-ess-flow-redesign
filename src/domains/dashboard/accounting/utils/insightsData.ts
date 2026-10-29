export const insightColors = {
    income: '#43B75D',
    expense: '#FF4F4F',
    track: '#F1F5F9',
    success: '#43B75D',
    danger: '#FF4F4F',
    warning: '#F59E0B',
    dangerTrail: '#FCA5A5',
    muted: '#667085',
};

export const insightsHeader = { title: 'Insights' };

export const insightsPremium = {
    title: 'Premium Feature',
    description:
        'Unlock deep insights — charts, tax exposure, cash flow, vendor analysis and more.',
    ctaLabel: 'Unlock Insights',
    note: '14-day free trial. No credit card required.',
};

export type SummaryTone = 'success' | 'danger';
export interface SummaryRow {
    label: string;
    value: string;
    tone: SummaryTone;
}

export type AttentionTone = 'warning' | 'danger' | 'neutral';
export interface AttentionItem {
    id: string;
    title: string;
    subtitle: string;
    tone: AttentionTone;
}

export interface AmountBar {
    label: string;
    value: string;
    amount: number;
    sublabel?: string;
}

export interface Vendor {
    id: string;
    name: string;
    value: string;
}

export interface AccountStat {
    id: string;
    name: string;
    inPercent: number;
    inValue: string;
    outValue: string;
}

export interface CashFlowBar {
    value: number;
    positive: boolean;
}
