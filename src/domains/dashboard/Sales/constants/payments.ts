import { ReminderTiming } from '../types/payments';

export const REMINDER_RULE_META: Record<
    string,
    { id: string; title: string; timing: ReminderTiming }
> = {
    BEFORE: { id: 'before_due', title: 'Before Due Date', timing: 'before' },
    ON_DUE: { id: 'on_due', title: 'On Due Date', timing: 'on_due' },
    AFTER: { id: 'after_due', title: 'After Due Date', timing: 'after' },
    SECOND_OVERDUE: { id: 'second_overdue', title: 'Second overdue notice', timing: 'after' },
};

export const REMINDER_RULE_SUBTITLE = 'Friendly payment reminder sent before the invoice due date';

export const TIMING_OPTIONS: Record<ReminderTiming, { value: number; label: string }[]> = {
    before: [
        { value: 1, label: '1 day before' },
        { value: 3, label: '3 days before' },
        { value: 7, label: '7 days before' },
    ],
    on_due: [{ value: 0, label: 'On due date' }],
    after: [
        { value: 7, label: '7 days after' },
        { value: 15, label: '15 days after' },
        { value: 30, label: '30 days after' },
    ],
};


export const PAYMENT_STATUS_LABEL: Record<string, string> = {
    SUCCESS: 'Paid',
    COMPLETED: 'Paid',
    PAID: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
};

export const STATUS_MAP: Record<string, string> = {
    SUCCESS: 'SUCCESS',
    PENDING: 'PENDING',
    FAILED: 'FAILED',
};

export const EXPORT_MIME: Record<string, string> = {
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    pdf: 'application/pdf',
};
