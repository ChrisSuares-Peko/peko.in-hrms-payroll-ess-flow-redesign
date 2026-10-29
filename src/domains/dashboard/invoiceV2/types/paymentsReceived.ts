export interface PaymentsReceivedRow {
    id: number;
    date: string;
    amount: string;
    mode: string;
    referenceId?: string | null;
    notes?: string | null;
    receiptNo?: string | null;
    invoiceId?: number;
    prefix?: string;
    invoiceNumber?: string;
    currency?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}

export interface GetAllPaymentsReceivedResponse {
    receipts: PaymentsReceivedRow[];
    recordsTotal: number;
    totalReceived: number;
}
