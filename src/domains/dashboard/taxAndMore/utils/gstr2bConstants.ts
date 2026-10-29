import type { MatchFilter, TabKey } from './gstr2bTypes';

export const fmt = (n: number | null | undefined) =>
    new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        n ?? 0
    );

export const MATCH_FILTERS: { key: MatchFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'Matched', label: 'Matched' },
    { key: 'Unmatched', label: 'Unmatched' },
    { key: 'Amended', label: 'Amended' },
];

export const TABS: { key: TabKey; label: string }[] = [
    { key: 'B2B', label: 'B2B' },
    { key: 'B2BA', label: 'B2BA' },
    { key: 'CDN', label: 'CDN' },
    { key: 'IMPG', label: 'IMPG' },
    { key: 'ISD', label: 'ISD' },
    { key: 'TDS', label: 'TDS' },
    { key: 'TCS', label: 'TCS' },
    { key: 'AMD', label: 'AMD' },
];

export const TAB_TITLES: Record<TabKey, string> = {
    B2B: 'Supplier Invoices',
    B2BA: 'Amended Invoices',
    CDN: 'Credit / Debit Notes',
    IMPG: 'Import of Goods',
    ISD: 'Input Service Distributor',
    TDS: 'Tax Deducted at Source',
    TCS: 'Tax Collected at Source',
    AMD: 'Amendment History',
};
