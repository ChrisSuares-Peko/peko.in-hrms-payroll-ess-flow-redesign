import type { RecurrenceRule } from '../../types/recurring';

export const UNIT_TO_FREQ: Record<string, RecurrenceRule['frequency']> = {
    DAYS: 'DAILY',
    WEEKS: 'WEEKLY',
    MONTHS: 'MONTHLY',
    QUARTERS: 'QUARTERLY',
    YEARS: 'YEARLY',
};

export const RECURRING_FREQ_LABEL: Record<string, string> = {
    DAYS: 'day',
    WEEKS: 'week',
    MONTHS: 'month',
    QUARTERS: 'quarter',
    YEARS: 'year',
};
