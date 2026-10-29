
export type CollectPaymentStep =
    | 'options'
    | 'send-link'
    | 'upi'
    | 'record'
    | 'payment-link-created'
    | 'payment-received';

export type SendPaymentLinkFormValues = {
    amount: string;
    customerName: string;
    customerPhone: string;
};

export type RecordManuallyFormValues = {
    amountPaid: string;
    paymentMethod: string;
    paymentDate: string | null;
    referenceId: string;
    notes: string;
};

export type VirtualAccountResponse = {
    id: number;
    status: string;
    activatedAt: string | null;
    businessName: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    virtualAccountNumber: string | null;
    virtualIfsc: string | null;
};

export type SendUPICollectFormValues = {
    amount: string;
    upiId: string;
    requestExpiry: string | null;
};

export interface UPICollectPendingData {
    amount: string;
    upiId: string;
    expiryMinutes: number;
}

export interface UPICollectSuccessData {
    amount: string;
    referenceId: string;
    dateTime: string;
}

export type UPICollectStep = 'form' | 'pending' | 'success' | 'failed';

type ENACHFrequency = 'monthly' | 'quarterly';

export interface ENACHMandateFormValues {
    customer: {
        name: string;
        email: string;
        mobile: string;
    };
    mandate: {
        maxAmount: string;
        frequency: ENACHFrequency;
        startDate: string | null;
        endDate: string | null;
        untilCancelled: boolean;
    };
    purpose: {
        description: string;
    };
}

export type VirtualAccount = {
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    swiftCode?: string;
    ifsc?: string;
    iban?: string;
    currency: string;
    type: 'International' | 'Domestic';
};
export interface VirtualAccountDetails {
    companyName?: string;
    documentNo?: string;
    accountName?: string;
    bankName?: string;
    iban?: string;
    swiftCode?: string;
    accountNumber?: string;
    currency?: string;
    routingNumber?: string;
    bankAddress?: string;
}

export type AddDomesticBankValues = {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: string;
    bankBranch: string;
};

// ─── Manual Payments (Invoice) ───────────────────────────────────────────────

export interface ManualPaymentRecord {
    id: number;
    invoiceId: number;
    amount: string;
    paymentMethod: string;
    paymentDate: string;
    referenceId?: string | null;
    notes?: string | null;
    isDeleted: boolean;
    receiptNo?: string | null;
    createdAt?: string;
}

// ─── Manual Payments (global, cross-invoice listing) ────────────────────────

export interface InvoicePaymentRow {
    paymentId: number;
    amount: string;
    paymentMethod: string;
    paymentDate: string;
    referenceId?: string | null;
    notes?: string | null;
    receiptNo?: string | null;
    invoiceId: number;
    prefix?: string | null;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: string;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
}

export interface GetAllManualPaymentsResponse {
    payments: InvoicePaymentRow[];
    recordsTotal: number;
}
