import dayjs from 'dayjs';

import { ReimbursementApiStatus, ReimbursementRecord } from '../types';

export type UiReimbursementStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

const STATUS_TO_UI: Record<ReimbursementApiStatus, UiReimbursementStatus> = {
    requestedByEmployee: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelledByEmployee: 'Cancelled',
};

const PAYMENT_STATUS_TO_UI: Record<string, UiReimbursementStatus> = {
    APPROVED: 'Approved',
    PAID: 'Approved',
    REJECTED: 'Rejected',
};

export const mapReimbursementStatus = (record: ReimbursementRecord): UiReimbursementStatus => {
    if (record.paymentStatus && PAYMENT_STATUS_TO_UI[record.paymentStatus]) {
        return PAYMENT_STATUS_TO_UI[record.paymentStatus];
    }
    return STATUS_TO_UI[record.status] ?? 'Pending';
};

// ₹ amount with 2 decimals (e.g. 500.5 -> "500.50").
export const formatAmount = (amount: number): string =>
    (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export interface ReimbursementUiRow {
    key: string;
    date: string;
    amount: number;
    details: string;
    method?: string;
    status: UiReimbursementStatus;
    receiptUrl?: string;
    canCancel: boolean;
}

export const toReimbursementRow = (record: ReimbursementRecord): ReimbursementUiRow => {
    const status = mapReimbursementStatus(record);
    return {
        key: record.id,
        date: dayjs(record.expenseDate).format('MMM D, YYYY'),
        amount: record.totalPay,
        details: record.expenseDetails || 'Reimbursement',
        method: record.transferMethod,
        status,
        receiptUrl: record.supportingDocs,
        // Only a still-pending, self-submitted claim can be cancelled — matches
        // the backend's guard exactly. HR-created reimbursements have no
        // `status` field at all and must never show a Cancel option.
        canCancel: record.status === 'requestedByEmployee',
    };
};
