import {
    formatNumberWithLocalString,
    formatNumberWithLocalStringWithoutDecimalPoint,
} from '@utils/priceFormat';

import { CardRecord, CardStatus, TabItem, TransactionItem } from './types';

const RECENT_TRANSACTION_STATUSES: TransactionItem['status'][] = [
    'Completed',
    'Declined',
    'Processing',
    'Reversed',
    'Refunded',
];

export const recentTransactionStatus = (status: string): TransactionItem['status'] =>
    RECENT_TRANSACTION_STATUSES.find(known => known === status) ?? 'Processing';

/** A card status as shown to the user, including the composite a pending termination produces. */
export type DisplayCardStatus = CardStatus | 'Frozen (Termination Requested)';

/** Card status for display: a frozen card awaiting termination reads as one combined status. */
export const displayCardStatus = (
    status: CardStatus,
    terminationStatus?: CardRecord['terminationStatus']
): DisplayCardStatus =>
    status === 'Frozen' && terminationStatus === 'REQUESTED'
        ? 'Frozen (Termination Requested)'
        : status;

/** Utilisation percentage, guarded against a zero/invalid limit. Returns 0–100. */
export const utilisationPercent = (used: number, limit: number): number =>
    limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;

/** Rupee amount, Indian grouping, decimals omitted when integer (card panels). */
export const formatRupees = (value: number): string =>
    `₹${formatNumberWithLocalStringWithoutDecimalPoint(value)}`;

/** Rupee amount with 2 decimals (table cells), e.g. ₹15,000.00. */
export const formatRupeesDecimal = (value: number): string =>
    `₹${formatNumberWithLocalString(value)}`;

/** Resolve a tab (or dropdown child) key to its display label; falls back to the key. */
export const getTabLabel = (tabs: TabItem[], key: string): string => {
    const all = tabs.flatMap(tab => [{ key: tab.key, label: tab.label }, ...(tab.children ?? [])]);
    return all.find(item => item.key === key)?.label ?? key;
};

/** Remove emoji characters from a string (used to sanitise search inputs). */
export const stripEmojis = (value: string): string =>
    value.replace(/\p{Extended_Pictographic}/gu, '').replace(/️/g, '');

/** Up-to-two-letter uppercase initials from a person's name (e.g. "Anto Rebe" → "AR"). */
export const getInitials = (name: string): string =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() ?? '')
        .join('');
/** How many blockers a "why is this disabled" tooltip lists before summarising the rest. */
export const BLOCKER_LIST_MAX = 6;

interface BlockerOptions {
    /** Section name for a field, prefixed onto its message. For forms that reuse a label across sections. */
    sectionFor?: (field: string) => string | undefined;
    max?: number;
}

/**
 * The reasons a form's submit is disabled, ready to list in a tooltip.
 *
 * Formik's own errors, capped. They are what actually gates the button, so listing them is the only way a
 * user can act on a field whose message is hidden behind `touched` — an optional field they never visit has
 * no error on screen at all.
 *
 * Deduplicated on the RENDERED line, not the raw message: a form that reuses one label across sections
 * ("City" for the registered, billing and bank addresses) produces identical messages for different fields,
 * and collapsing those would report three missing cities as one.
 */
export const blockerReasons = (
    errors: Record<string, unknown>,
    { sectionFor, max = BLOCKER_LIST_MAX }: BlockerOptions = {}
): string[] => {
    const lines = Object.entries(errors)
        .filter(([, value]) => !!value && typeof value === 'string')
        .map(([field, message]) => {
            const section = sectionFor?.(field);
            return section ? `${section} · ${message as string}` : (message as string);
        });
    const unique = [...new Set(lines)];
    if (unique.length <= max) return unique;
    return [...unique.slice(0, max), `…and ${unique.length - max} more`];
};

export const normalizeDocumentFormat = (typeExtension: string, fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? typeExtension;
    const map: Record<string, string> = {
        jpeg: 'jpg',
        jpg: 'jpg',
        png: 'png',
        pdf: 'pdf',
        doc: 'doc',
        docx: 'docx',
    };
    return map[ext] ?? map[typeExtension] ?? typeExtension;
};
