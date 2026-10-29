import dayjs from 'dayjs';

import { FilePayload } from '../types/settings';

export const fileToPayload = (file: File): Promise<FilePayload> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            const format = file.name.split('.').pop() ?? 'png';
            resolve({ file: base64, format });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export const getLastMonthDateRange = () => {
    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

    return { startDate, endDate };
};

export const formatDate = (value?: string | Date): string => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatDateAndTime = (value?: string | Date): string => {
    if (!value) return '';
    // Date-only strings (YYYY-MM-DD) have no time — parse as local to avoid UTC offset
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    // Full datetime string or Date object — show time in local timezone
    const d = typeof value === 'string' ? new Date(value) : value;
    const time = d
        .toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
        .replace(/\s+(am|pm)$/i, ' $1');
    const date = d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    return `${date} · ${time}`;
};

export const shareViaWhatsApp = (text: string): void => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};

export const copyBankDetails = (rows: { label: string; value: string }[]): void => {
    const text = rows.map(r => `${r.label}: ${r.value}`).join('\n');
    navigator.clipboard.writeText(text);
};

export const formatCompactAmount = (amount: number): string => {
    if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
    if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(1)}L`;
    if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
    return `₹${amount.toFixed(2)}`;
};

export const formatAmount = (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const abs = Math.abs(num);
    const formatted = abs.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return num < 0 ? `-₹ ${formatted}` : `₹ ${formatted}`;
};

export const formatCurrencyAmount = (amount: number | string, currency?: string | null): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const abs = Math.abs(Number.isNaN(num) ? 0 : num);
    const formatted = abs.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const symbol = !currency || currency === 'INR' ? '₹' : currency;
    return num < 0 ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
};

export const toTitleCase = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const maskAccountNumber = (accountNumber: string): string =>
    accountNumber.length > 4
        ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
        : accountNumber;

export const splitGstin = (gstin: string) => ({
    stateCode: gstin.slice(0, 2),
    panLetters: gstin.slice(2, 12),
    entityNumber: gstin.slice(12, 13),
    suffix: gstin.slice(13, 15),
});
