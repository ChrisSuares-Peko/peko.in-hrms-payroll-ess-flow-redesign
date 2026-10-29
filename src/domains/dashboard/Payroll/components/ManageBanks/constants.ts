import type { CSSProperties } from 'react';

export const RED = '#FF4F4F';
export const CARD_BORDER = '1px solid #e2e8f0';
export const PRIMARY_BORDER = `1.5px solid ${RED}`;
export const BADGE_BG = '#ecfdf5';
export const BADGE_TEXT = '#43b75d';
export const LABEL_COLOR = '#64748b';
export const VALUE_COLOR = '#1e293b';

export const cardBase: CSSProperties = {
    flex: '1 1 calc(25% - 12px)',
    maxWidth: 'calc(25% - 12px)',
    minWidth: 240,
    border: CARD_BORDER,
    borderRadius: 12,
    padding: '16px',
    background: '#fff',
    cursor: 'pointer',
    position: 'relative',
};

export const maskAccountNumber = (num: string) =>
    num && num.length > 4 ? `*****${  num.slice(-4)}` : num;

export const formatCurrency = (val: number | null) =>
    val !== null && val !== undefined
        ? `₹${val.toLocaleString('en-IN')}`
        : '₹0';
