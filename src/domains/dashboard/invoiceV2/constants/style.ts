import type { CSSProperties } from 'react';

export const TABLE_HEADER_STYLE: CSSProperties = {
    backgroundColor: '#FAFBFB',
    color: '#42526D',
    fontWeight: 600,
    fontSize: '14px',
    borderBottom: '1.24px solid #EAECF0',
};
export const STATUS_STYLE: Record<string, string> = {
    Paid: 'bg-[#ECFDF5] text-[#43B75D]',
    Pending: 'bg-[#FFF7ED] text-[#F97316]',
    Overdue: 'bg-[#FEF2F2] text-[#EF4444]',
    Partial: 'bg-[#EFF6FF] text-[#3B82F6]',
    'Refund Due': 'bg-[#FEF3C7] text-[#D97706]',
    Refunded: 'bg-[#ECFDF5] text-[#0D9488]',
};
