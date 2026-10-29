import { DisputeStatus } from '../types';

export const formatHours = (totalHours?: number): string | null => {
    if (!totalHours || totalHours <= 0) return null;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
};

// UI labels used by the attendance table / status tags.
export type UiAttendanceStatus = 'Present' | 'Late' | 'Leave' | 'Absent' | 'Half Day';

// Mirrors the leave deduction log's DEDUCTION_DAYS mapping on the backend.
export const DISPUTE_DEDUCTION_DAYS: Record<'late' | 'absent', number> = {
    late: 0.5,
    absent: 1,
};

export interface AttendanceUiRow {
    key: string;
    date: string;
    rawDate: string;
    checkIn: string | null;
    checkOut: string | null;
    hours: string | null;
    status: UiAttendanceStatus;
    isLate: boolean;
    lateMinutes?: number;
    disputeRaised: boolean;
    disputeStatus?: DisputeStatus;
}
