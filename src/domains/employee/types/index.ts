export interface DashboardProfile {
    name: string;
    designation: string;
    department: string;
    employeeId: string;
    avatar?: string;
    /** ISO date string of the current working day */
    today: string;
    isCheckedIn: boolean;
    isCheckedOut: boolean;
    /** Whether today's check-in was recorded as late (from the attendance status). */
    isLate: boolean;
    /** Minutes late, when the check-in was late. */
    lateMinutes?: number;
    /** ISO timestamp of today's check-in (drives the live shift timer). */
    checkInTime?: string;
    /** Today's total worked hours, available once checked out. */
    totalHours?: number;
    /** True once checked out AND worked enough of the scheduled shift (gates the "Shift Complete" message). */
    shiftComplete: boolean;
    /** Whether the corporate allows ESS check-in/out (gates the button). */
    checkInOutEnabled: boolean;
    /** Whether a check-in can be made now (false if today's already marked, e.g. half-day late arrival). */
    isCheckInAvailable: boolean;
    /** Optional reason shown when check-in isn't available. */
    checkInUnavailableReason?: string;
}

/** Generic three-bucket stat used by the attendance donut. */
export interface StatBreakdown {
    onTime: number;
    late: number;
    notPresent: number;
    total: number;
    /** e.g. "12% more than Wednesday" */
    comparison?: string;
}

export type DashboardAttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Leave';

export interface DashboardAttendanceRow {
    id: string;
    name: string;
    joinDate: string;
    checkout: string;
    hours: string;
    status: DashboardAttendanceStatus;
}

export interface Announcement {
    id: string;
    title: string;
    description: string;
    date: string;
}

export interface EmployeeDashboard {
    profile: DashboardProfile;
    attendance: StatBreakdown;
    attendanceRecords: DashboardAttendanceRow[];
    announcements: Announcement[];
}

export interface PayslipRow {
    id: string | null;
    year: number;
    month: number;
    payingDate?: string;
    paymentStatus?: string;
    totalPayable: number;
    salaryInformation?: {
        basicPay?: number;
        increamentAmount?: number;
        hraAmount?: number;
        daAmount?: number;
        other?: number;
        epfAmount?: number;
        esiAmount?: number;
        lwfAmount?: number;
        deductionAmount?: number;
        tdsAmount?: number;
    };
    totalIncentive?: number;
    totalBonus?: number;
    totalOvertime?: number;
    totalReimbursement?: number;
    leaveDeduction?: number;
    totalOtherDeduction?: number;
    nonWorkingDaysDeduction?: number;
    /** Days paid this month; Loss of Pay shows here, never as a deduction. */
    payDays?: { daysInMonth?: number; eligibleDays?: number; lopDays?: number; paidDays?: number } | null;
    /** One-time recoveries applied this month, named by type with HR's note. */
    oneTimeDeductions?: { label: string; note?: string; amount: number }[];
}

export interface AvailableLeave {
    value: string;
    label: string;
    count: number | 'Available';
}

export type LeaveApiStatus = 'applied' | 'approved' | 'rejected' | 'cancelledByEmployee';

export interface LeaveDoc {
    id: string;
    start: string;
    end: string;
    typeOfLeave: { id: string; leaveType: string } | null;
    halfDaySelection?: 'FIRST_HALF' | 'SECOND_HALF';
    leaveCount: number;
    status: LeaveApiStatus;
    notes?: string;
}

export interface HolidayDoc {
    id: string;
    start: string;
    end: string;
    title: string;
    category: string;
}

export type DisputeStatus = 'requestedByEmployee' | 'approved' | 'rejected';

export interface DeductionLogRecord {
    id: string;
    date: string;
    type: string;
    status: 'late' | 'absent';
    lateMinutes?: number;
    deduction: number;
    disputeRaised: boolean;
    disputeStatus?: DisputeStatus;
}

export type ReimbursementApiStatus =
    | 'requestedByEmployee'
    | 'approved'
    | 'rejected'
    | 'cancelledByEmployee';

export interface ReimbursementRecord {
    id: string;
    expenseDate: string;
    totalPay: number;
    expenseDetails?: string;
    transferMethod?: string;
    status: ReimbursementApiStatus;
    paymentStatus?: string;
    supportingDocs?: string;
}

export interface DocumentRequest {
    id: string;
    documentType: string;
    status: 'pending' | 'in-progress' | 'completed' | 'rejected';
}
