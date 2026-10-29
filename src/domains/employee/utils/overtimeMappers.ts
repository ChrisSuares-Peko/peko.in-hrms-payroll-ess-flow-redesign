import { formatHours } from './attendanceMappers';

// UI labels used by the overtime table / status tags.
export type UiOvertimeStatus = 'Approved' | 'Rejected' | 'Pending' | 'Cancelled';

// Formats a decimal hours total for the summary card (e.g. 13.5 -> "13h 30m").
export const formatOtHours = (totalHours: number): string => formatHours(totalHours) ?? '0h';

export interface OvertimeUiRow {
    key: string;
    date: string;
    rawDate: string;
    hours: string;
    description: string;
    status: UiOvertimeStatus;
    canCancel: boolean;
}
