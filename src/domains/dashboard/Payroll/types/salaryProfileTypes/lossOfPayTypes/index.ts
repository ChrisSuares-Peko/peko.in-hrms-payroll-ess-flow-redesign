export interface LossOfPaySheetRow {
    employeeId: string;
    salaryId: string;
    employeeName: string | null;
    employeeCode: string | null;
    department: string | null;
    /** Calendar or company working days, per the Payroll Cycle setting. */
    daysInMonth: number;
    /** Days on payroll this month — fewer than daysInMonth for a joiner or leaver. */
    eligibleDays: number;
    grossBeforeLop: number;
    perDayRate: number;
    days: number;
    amount: number;
    isAmountOverridden: boolean;
    paymentStatus: string;
    /** Already paid (or being paid) — read-only. */
    isLocked: boolean;
}

export interface LossOfPaySheet {
    month: number;
    year: number;
    /** What "Days in month" counts, per the Payroll Cycle setting. */
    daysBasis?: 'CALENDAR_DAYS' | 'WORKING_DAYS';
    isMonthPaid: boolean;
    employeesWithLop: number;
    rows: LossOfPaySheetRow[];
    updatedCount?: number;
}

export interface LossOfPayEntry {
    employeeId: string;
    days: number;
    amount: number;
    isAmountOverridden: boolean;
}

export interface LossOfPayRequestBase {
    userType: string;
    userId: string | number;
    month: number;
    year: number;
}

export interface SaveLossOfPayPayload extends LossOfPayRequestBase {
    entries: LossOfPayEntry[];
}
