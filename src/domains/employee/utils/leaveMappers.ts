import dayjs from 'dayjs';

import { LeaveApiStatus } from '../types';

export type UiLeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

const STATUS_TO_UI: Record<LeaveApiStatus, UiLeaveStatus> = {
    applied: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    cancelledByEmployee: 'Cancelled',
};

export const mapLeaveStatus = (status: LeaveApiStatus): UiLeaveStatus =>
    STATUS_TO_UI[status] ?? 'Pending';

// "Apr 21, 2026" / "Apr 21–23, 2026" / "Apr 30 – May 2, 2026"
export const formatDateRange = (start: string, end: string): string => {
    const s = dayjs(start);
    const e = dayjs(end);
    if (s.isSame(e, 'day')) return s.format('MMM D, YYYY');
    if (s.isSame(e, 'month')) return `${s.format('MMM D')}–${e.format('D, YYYY')}`;
    return `${s.format('MMM D')} – ${e.format('MMM D, YYYY')}`;
};

// Balance card big value: number stays, 'Available' (unpaid) -> ∞, else the raw string.
export const formatLeaveCount = (count: number | string): string => {
    if (typeof count === 'number') return String(count);
    if (count === 'Available') return '∞';
    return count;
};

export interface LeaveUiRow {
    key: string;
    dateRange: string;
    type: string;
    days: number;
    status: UiLeaveStatus;
    notes?: string;
    canCancel: boolean;
}

export interface HolidayUiRow {
    key: string;
    date: string;
    endDate: string;
    name: string;
    type: string;
}
