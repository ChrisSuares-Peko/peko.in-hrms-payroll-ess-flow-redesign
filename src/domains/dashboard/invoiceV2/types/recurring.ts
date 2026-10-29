export type RecurringFrequencyUnit = 'DAYS' | 'WEEKS' | 'MONTHS' | 'QUARTERS' | 'YEARS';
export type RecurringFrequency = { unit: RecurringFrequencyUnit; every: number };

export type RecurringEndConditionType = 'ON' | 'AFTER' | 'FOREVER';
export type RecurringEndCondition = {
    type: RecurringEndConditionType;
    date?: string;
    runs?: number;
};

export type RecurringScheduleStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface GeneratedInvoice {
    invoiceId: string;
    invoiceNo: string;
    prefix: string;
    total: string;
    invoiceDate: string;
    createdAt: string;
}

export interface RecurringSourceInvoice {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
    totalAmount: string;
    invoiceDate: string;
    dueDate: string;
    prefix: string;
    invoiceNumber: string;
}

export interface RecurringScheduleApiData {
    id: string;
    scheduleName: string;
    frequency: RecurringFrequency;
    startDate: string;
    nextRunDate: string | null;
    endCondition: RecurringEndCondition;
    status: RecurringScheduleStatus;
    autoSend: boolean;
    completedRuns: number;
    generatedInvoices: GeneratedInvoice[];
    sourceInvoiceId: string;
    sourceInvoice?: RecurringSourceInvoice;
    createdAt: string;
}

export interface RecurringListStats {
    totalSchedule: number;
    active: number;
    revenueGenerated: number;
}

export interface FetchRecurringListPayload {
    userId: number;
    userType: string;
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    status?: RecurringScheduleStatus;
    from?: string;
    to?: string;
}

export interface CreateRecurringSchedulePayload {
    userId: number;
    userType: string;
    scheduleName: string;
    sourceInvoiceId: string;
    frequency: RecurringFrequency;
    startDate: string;
    endCondition?: RecurringEndCondition;
    autoSend?: boolean;
}

// Frontend-only rule shape used by the recurrence engine and modal
export type RecurringFrequencyLabel = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurrenceRule {
    frequency: RecurringFrequencyLabel;
    interval: number;
    startDate: string;
    endCondition: {
        type: 'NEVER' | 'AFTER' | 'ON';
        count?: number;
        date?: string;
    };
}
