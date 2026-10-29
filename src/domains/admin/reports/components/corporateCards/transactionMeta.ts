export type TransactionStatus = 'Completed' | 'Processing' | 'Declined' | 'Reversed' | 'Refunded';

export type TagTone = { color: string; bg: string };

export const STATUS_TONE: Record<TransactionStatus, TagTone> = {
    Completed: { color: '#3AB75E', bg: '#ECFDF5' },
    Processing: { color: '#D97706', bg: '#FFFBEB' },
    Declined: { color: '#E11D48', bg: '#FEF2F2' },
    Reversed: { color: '#B45309', bg: '#FFF7ED' },
    Refunded: { color: '#2563EB', bg: '#EFF6FF' },
};

export const STATUS_QUERY: Record<TransactionStatus, { decision: string; internalStatus: string }> =
    {
        Completed: { decision: 'AUTHORIZED', internalStatus: 'NOTIFIED' },
        Processing: { decision: 'AUTHORIZED', internalStatus: 'AUTH_RECEIVED' },
        Declined: { decision: 'DECLINED', internalStatus: 'AUTH_RECEIVED' },
        Reversed: { decision: 'DECLINED', internalStatus: 'REVERSED' },
        Refunded: { decision: 'AUTHORIZED', internalStatus: 'REFUNDED' },
    };

export const STATUS_OPTIONS = (Object.keys(STATUS_QUERY) as TransactionStatus[]).map(value => ({
    label: value,
    value,
}));

export const EVENT_LABEL: Record<string, string> = {
    AUTH: 'Authorisation',
    NOTIFY: 'Notification',
};

export const TRANSACTION_TYPE_LABEL: Record<number, string> = {
    2: 'Purchase',
    18: 'Reversal',
    23: 'Refund',
};

export const TRANSACTION_TYPE_OPTIONS = Object.entries(TRANSACTION_TYPE_LABEL).map(
    ([value, label]) => ({ label, value })
);

export const TRANSACTION_MODE_LABEL: Record<number, string> = { 5: 'ATM' };

export const eventLabel = (value: string) => EVENT_LABEL[value] ?? value;

export const transactionTypeLabel = (value: number | null) =>
    value === null ? '-' : (TRANSACTION_TYPE_LABEL[value] ?? `Type ${value}`);

export const transactionModeLabel = (value: number | null) =>
    value === null ? '-' : (TRANSACTION_MODE_LABEL[value] ?? `Mode ${value}`);

export const statusTone = (status: string) =>
    STATUS_TONE[status as TransactionStatus] ?? STATUS_TONE.Processing;

// Detail drawer grid. Every breakpoint is set on purpose: antd falls back to its default of 3 columns for
// any breakpoint left out, which squeezed the 720px drawer on wide screens until "CC000091" broke mid-word.
export const DESCRIPTION_COLUMNS = { xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 };
export const FULL_ROW_SPAN = { xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 };

// One label width for every section, so labels and values line up down the whole drawer.
export const DESCRIPTION_STYLES = {
    label: { width: 140, verticalAlign: 'middle' as const },
    content: { verticalAlign: 'middle' as const },
};
