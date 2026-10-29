export type JournalRecordStatus = Record<string, boolean> | null;

export type OrderDocumentAvailability = {
    subscriber: {
        invoice: boolean;
        planInvoice: boolean;
        receipt: boolean;
    };
    vendor: {
        invoice: boolean;
        planInvoice: boolean;
    };
};

export type OrderDocumentRecipient = 'subscriber' | 'vendor';
export type OrderDocumentType = 'invoice' | 'planInvoice' | 'receipt';

export type OrderDocumentDownloadResponse = {
    pdfBuffer: {
        type: string;
        data: [];
    };
};

export type OrderJournalInfo = {
    id: number;
    transactionDate: string;
    corporateTxnId: string;
    transactionCategory: string | null;
    credentialId: number | null;
    serviceOperator: {
        id: number | null;
        serviceProvider: string;
        serviceCategory: string;
    } | null;
    credential: {
        id: number;
        name: string;
        username: string;
        email: string;
    } | null;
    order: {
        id: number;
        corporateTxnId: string;
        amountInINR: string | null;
        surcharge: string | null;
        paymentMode: string | null;
        paymentModeResponse: string | null;
        status: string | null;
        journalRecordStatus: JournalRecordStatus;
        journalData: Record<string, any> | null;
    };
    documents: OrderDocumentAvailability;
};

export interface orderJournalResponse {
    result: OrderJournalInfo[];
    totalData: number;
}

export type JournalKey = 'transaction' | 'refund' | 'adminRefund' | 'cashback' | 'cashbackReversal';

export type RetryJournalPayload = {
    journalData?: Record<string, number>;
    amount?: number;
    refundAmount?: number;
    totalOrderAmount?: number;
};

export type JournalRetryResult = {
    success: boolean;
    providerJournalId?: string | null;
    skipped?: boolean;
    reason?: string;
    error?: string;
    // Only set on a "transaction" retry: Refund/Admin Refund retried automatically
    // right after, if either was marked failed.
    cascaded?: Partial<Record<JournalKey, JournalRetryResult>>;
};

export type RetryAllFailedResult = {
    results: Partial<Record<JournalKey, JournalRetryResult>>;
};
