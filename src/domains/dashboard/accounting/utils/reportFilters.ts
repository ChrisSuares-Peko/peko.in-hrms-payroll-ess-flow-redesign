import dayjs from 'dayjs';

export interface SelectOption {
    value: string;
    label: string;
}

export const FINANCIAL_YEARS: string[] = ['FY 2025-26', 'FY 2024-25'];

export const FINANCIAL_YEARS_LONG: string[] = ['FY 2025-26', 'FY 2024-25', 'FY 2023-24'];

export interface FyOption {
    value: number; // FY start year — 2025 => FY 2025-26 (Apr 1 2025 → Mar 31 2026)
    label: string;
}

// FY label for a start year — 2025 => "FY 2025-26".
export const fyLabel = (fy: number): string => `FY ${fy}-${String(fy + 1).slice(2)}`;

// Financial year start for the current date (Apr–Mar): Jan–Mar belongs to the previous FY.
export const currentFyStart = (): number => {
    const now = dayjs();
    return now.month() + 1 >= 4 ? now.year() : now.year() - 1;
};

// Current calendar month (1–12), matching the `month` API param.
export const currentCalendarMonth = (): number => dayjs().month() + 1;

// Last 10 financial years as start-year integers (newest first), matching the `fy` API param.
export const FY_OPTIONS: FyOption[] = Array.from({ length: 10 }, (_, i) => {
    const value = currentFyStart() - i;
    return { value, label: fyLabel(value) };
});

// Sentinel period value meaning "no month/quarter filter → the whole financial year".
export const FULL_YEAR = 'full-year';

// Period selector for the P&L page: full year, or a single calendar month within the FY.
// Months are listed in fiscal order (Apr → Mar) but each carries its calendar month value,
// matching the `month` API param (Jan–Mar resolve to the next calendar year within the FY).
export const MONTH_PERIOD_OPTIONS: SelectOption[] = [
    { value: FULL_YEAR, label: 'Full year' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
];

export const PERIOD_OPTIONS: SelectOption[] = [
    { value: 'full-year', label: 'Full year' },
    { value: 'q1', label: 'Q1 (Apr - Jun)' },
    { value: 'q2', label: 'Q2 (Jul - Sep)' },
    { value: 'q3', label: 'Q3 (Oct - Dec)' },
    { value: 'q4', label: 'Q4 (Jan - Mar)' },
];

export const fyPeriodToRange = (fy: string, period: string): { from: string; to: string } => {
    const start = Number(fy.replace(/[^0-9]/g, '').slice(0, 4));
    const end = start + 1;
    switch (period) {
        case 'q1':
            return { from: `${start}-04-01`, to: `${start}-06-30` };
        case 'q2':
            return { from: `${start}-07-01`, to: `${start}-09-30` };
        case 'q3':
            return { from: `${start}-10-01`, to: `${start}-12-31` };
        case 'q4':
            return { from: `${end}-01-01`, to: `${end}-03-31` };
        default:
            return { from: `${start}-04-01`, to: `${end}-03-31` };
    }
};

// Explicit date range for an FY (+ optional calendar month within it), for endpoints that
// only accept from/to. month 4–12 → same calendar year as `fy`; month 1–3 → next year.
export const fyMonthToRange = (fy: number, month?: number): { from: string; to: string } => {
    if (!month) {
        return { from: `${fy}-04-01`, to: `${fy + 1}-03-31` };
    }
    const year = month >= 4 ? fy : fy + 1;
    const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    return { from: start.format('YYYY-MM-DD'), to: start.endOf('month').format('YYYY-MM-DD') };
};

export const REPORT_STATUS_OPTIONS: SelectOption[] = [
    { value: 'all', label: 'All Status' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
    { value: 'overdue', label: 'Overdue' },
];
