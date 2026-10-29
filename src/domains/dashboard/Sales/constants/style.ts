import type { CSSProperties } from 'react';

import type { RankingVariant, ScheduledReminderRow } from '../types/payments';

export const TABLE_HEADER_STYLE: CSSProperties = {
    backgroundColor: '#FAFBFB',
    color: '#42526D',
    fontWeight: 600,
    fontSize: '14px',
    borderBottom: '1.24px solid #EAECF0',
};

export const CARD_BODY_CLASS = 'flex flex-col gap-4';

export const ACTIVITY_DOT_COLORS: Record<string, string> = {
    'Payment Received': '#43B75D',
    'Payment Reminder Sent': '#64748B',
    'Invoice Overdue': '#EF4444',
    'Refund Processed': '#F59E0B',
    'Reminder sent': '#64748B',
    'Reminder Viewed': '#94A3B8',
    'Customer Responded': '#43B75D',
};

export const REMINDER_STATUS_STYLE: Record<ScheduledReminderRow['reminderStatus'], string> = {
    Sent: 'bg-[#ECFDF5] text-[#43B75D]',
    Scheduled: 'bg-[#FFF7ED] text-[#F97316]',
    'No response': 'bg-[#F4F4F5] text-[#71717A]',
};

export const RANKING_VARIANT_STYLES: Record<
    RankingVariant,
    { badge: string; badgeText: string; primaryRight: string; secondaryRight: string }
> = {
    revenue: {
        badge: 'bg-[#ECFDF5]',
        badgeText: 'text-[#43B75D]',
        primaryRight: 'text-[#1E293B]',
        secondaryRight: 'text-[#43B75D]',
    },
    txn: {
        badge: 'bg-[#F2F7FB]',
        badgeText: 'text-[#2B5678]',
        primaryRight: 'text-[#038E36]',
        secondaryRight: 'text-[#A1A1AA]',
    },
    due: {
        badge: 'bg-[#F2F7FB]',
        badgeText: 'text-[#2B5678]',
        primaryRight: 'text-[#1E293B]',
        secondaryRight: 'text-[#A1A1AA]',
    },
    activity: {
        badge: '',
        badgeText: '',
        primaryRight: 'text-[#1E293B]',
        secondaryRight: 'text-[#A1A1AA]',
    },
    paying: {
        badge: 'bg-[#FEE2E2]',
        badgeText: 'text-[#FF4F4F]',
        primaryRight: 'text-[#43B75D]',
        secondaryRight: 'text-[#43B75D]',
    },
};

export const PAYMENT_STATUS_STYLE: Record<string, string> = {
    SUCCESS: 'bg-[#ECFDF5] text-[#43B75D]',
    COMPLETED: 'bg-[#ECFDF5] text-[#43B75D]',
    PAID: 'bg-[#ECFDF5] text-[#43B75D]',
    PENDING: 'bg-[#FFF7ED] text-[#F97316]',
    FAILED: 'bg-[#FEF2F2] text-[#EF4444]',
};

export const AGREEMENT_STATUS_STYLE: Record<string, { bg: string; text: string }> = {
    Active: { bg: '#ECFDF5', text: '#43B75D' },
    Draft: { bg: '#F4F4F5', text: '#71717A' },
    Pending: { bg: '#FFF7ED', text: '#F97316' },
    Sent: { bg: '#FEE2E2', text: '#EF4444' },
    Signed: { bg: '#ECFDF5', text: '#43B75D' },
    'Expiring soon': { bg: '#F4F4F5', text: '#71717A' },
};

export const CUSTOMER_SIGN_COLOR = { bg: '#D9EECC', border: '#05BE63', text: '#15803D' };
