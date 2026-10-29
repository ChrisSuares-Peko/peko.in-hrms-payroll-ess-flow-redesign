export const CREDIT_NOTE_REASON_OPTIONS = [
    { label: 'Goods Returned', value: 'GOODS_RETURNED' },
    { label: 'Overcharge', value: 'OVERCHARGE' },
    { label: 'Service Cancelled', value: 'SERVICE_CANCELLED' },
    { label: 'Discount Applied', value: 'DISCOUNT' },
    { label: 'Other', value: 'OTHER' },
];

export const CREDIT_NOTE_REASON_LABELS: Record<string, string> = {
    GOODS_RETURNED: 'Goods Returned',
    OVERCHARGE: 'Overcharge',
    SERVICE_CANCELLED: 'Service Cancelled',
    DISCOUNT: 'Discount Applied',
    OTHER: 'Other',
};

// Same hex pairs as the sibling "Invoice Status" tag (STATUS_STYLE in constants/style.ts)
// for Pending/Refunded, so the two status pills on the invoice-details page match.
export const CREDIT_NOTE_STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string }
> = {
    PENDING: { label: 'Pending', color: '#F97316', bg: '#FFF7ED' },
    REFUNDED: { label: 'Refunded', color: '#0D9488', bg: '#ECFDF5' },
};

export const CREDIT_NOTE_STATUS_OPTIONS = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Refunded', value: 'REFUNDED' },
];

export const CREDIT_NOTE_REASON_COLORS: Record<string, string> = {
    GOODS_RETURNED: '#EA580C',
    OVERCHARGE: '#DC2626',
    SERVICE_CANCELLED: '#2563EB',
    DISCOUNT: '#16A34A',
    OTHER: '#71717A',
};
