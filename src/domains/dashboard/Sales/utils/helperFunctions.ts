import dayjs from 'dayjs';

import { RankingData, RankingVariant } from '../types/payments';
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

export const generateDocumentNumber = (): string => {
    const now = dayjs();
    return `${now.format('YYYY')}-${now.format('MMDDHHmmss')}`;
};

export const formatDate = (value?: string | Date): string => {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value) : value;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatDateAndTime = (value?: string | Date, showTime: boolean = true): string => {
    if (!value) return '';
    // Date-only strings (YYYY-MM-DD) have no time — parse as local to avoid UTC offset
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    // Full datetime string or Date object — show time in local timezone
    const d = typeof value === 'string' ? new Date(value) : value;
    const time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
    const date = d.toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    return showTime ? `${time} · ${date}` : `${date}`;
};

export const shareViaWhatsApp = (text: string): void => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};

export const copyBankDetails = (rows: { label: string; value: string }[]): void => {
    const text = rows.map(r => `${r.label}: ${r.value}`).join('\n');
    navigator.clipboard.writeText(text);
};

export const formatAmount = (amount: number): string => {
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return amount < 0 ? `-₹ ${formatted}` : `₹ ${formatted}`;
};

export const formatCurrency = (amount: number, currency?: string): string => {
    const isInternational = currency && currency !== 'INR';
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    if (isInternational) {
        return amount < 0 ? `-${currency} ${formatted}` : `${currency} ${formatted}`;
    }
    return amount < 0 ? `-₹ ${formatted}` : `₹ ${formatted}`;
};

export const toInitials = (name: string): string =>
    name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');

export const toTitleCase = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const getRankingRowValues = (item: RankingData, variant: RankingVariant) => {
    if (variant === 'revenue' || variant === 'paying') {
        const pct = item.changePercent ?? 0;
        return {
            secondaryText: item.transactionCount
                ? `${item.transactionCount} transactions`
                : undefined,
            primaryRight: formatAmount(item.totalRevenue || 0),
            secondaryRight: item.changePercent != null ? `${pct > 0 ? '+' : ''}${pct}%` : undefined,
        };
    }
    if (variant === 'txn') {
        const pct = item.percentOfTotal ?? 0;
        return {
            secondaryText: item.totalRevenue ? formatAmount(item.totalRevenue) : undefined,
            primaryRight: `${item.transactionCount} orders`,
            secondaryRight:
                item.percentOfTotal != null ? `${pct > 0 ? '+' : ''}${pct}% of total` : undefined,
        };
    }
    if (variant === 'due') {
        return {
            secondaryText: item.dueDate ? `Due: ${formatDateAndTime(item.dueDate, false)}` : undefined,
            primaryRight: formatAmount(item.amount ?? 0),
            secondaryRight: undefined,
        };
    }
    // activity
    return {
        secondaryText: item.subtitle,
        primaryRight: item.amount ? formatAmount(item.amount) : '',
        secondaryRight: item.time,
    };
};

export const renderPreview = (template: string) => {
    const PREVIEW_SAMPLE: Record<string, string> = {
        '{customer_name}': 'Acme Corp',
        '{invoice_id}': 'INV-0042',
        '{amount}': '₹18,500',
        '{due_date}': '28 Mar 2026',
        '{payment_link}': '[link]',
    };
    return Object.entries(PREVIEW_SAMPLE).reduce(
        (text, [key, val]) => text.replaceAll(key, val),
        template
    );
};

export const parseEmailTemplate = (template: string) => {
    const lines = template.split('\n');
    const subject = lines[0].startsWith('Subject: ') ? lines[0].slice(9) : lines[0];
    const body = lines.slice(1).join('\n').replace(/^\n+/, '');
    return { subject, body };
};

export const getLastMonthDateRange = () => {
    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

    return { startDate, endDate };
};

export const maskAccountNumber = (accountNumber: string): string =>
    accountNumber.length > 4
        ? `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
        : accountNumber;