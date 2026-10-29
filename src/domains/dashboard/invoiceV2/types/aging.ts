export type AgingBucketKey = 'current' | '1_to_30' | '31_to_60' | '61_to_90' | 'above_90';

export interface AgingAnalysisInvoiceItem {
    id: string;
    invoiceNumber: string;
    prefix: string;
    name: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: string;
    amountPaid: string;
    amountDue: string;
    currency?: string;
    status: string;
    daysOverdue: number;
    outstandingAmount: string;
}

export interface AgingBucketItem {
    label: string;
    count: number;
    amount: number;
}

export interface AgingAnalysisResponse {
    filters: {
        timePeriod: string;
        sortBy: string;
        sortOrder: string;
        page: number;
        limit: number;
    };
    summary: {
        outstanding: { amount: number; changePercentage: number };
        overdue: { amount: number; changePercentage: number };
        paid: { amount: number; changePercentage: number };
        avgDaysToPay: number;
    };
    agingAnalysis: {
        buckets: AgingBucketItem[];
        totalOutstanding: number;
        totalPaid: number;
    };
    invoices: AgingAnalysisInvoiceItem[];
    pagination: {
        page: number;
        limit: number;
        totalRecords: number;
        totalPages: number;
    };
}

export interface FetchAgingAnalysisPayload {
    userId: number;
    userType: string;
    timePeriod?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
