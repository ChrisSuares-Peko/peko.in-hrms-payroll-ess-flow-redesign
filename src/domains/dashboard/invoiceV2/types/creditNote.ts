export type CreditNoteReason =
    | 'GOODS_RETURNED'
    | 'OVERCHARGE'
    | 'SERVICE_CANCELLED'
    | 'DISCOUNT'
    | 'OTHER';

export type CreditNoteStatus = 'PENDING' | 'REFUNDED';

export interface CreditNoteRow {
    id: string;
    creditNoteNumber: string;
    prefix?: string;
    linkedInvoiceId: string;
    linkedInvoiceNumber?: string;
    linkedInvoicePrefix?: string;
    reason: CreditNoteReason;
    reasonDetail?: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    gstNumber?: string;
    status: CreditNoteStatus;
    currency: string;
    totalAmount: string;
    originalTotalAmount?: string;
    amountDue: string;
    originalAmountDue?: string;
    issueDate: string;
    dueDate?: string;
    items?: CreditNoteItem[];
    subtotal?: string;
    tax?: string;
    discount?: string;
    shippingCost?: string;
    notes?: string;
    termsAndConditions?: string;
    createdAt: string;
}

export interface CreditNoteItem {
    name: string;
    hsn?: string;
    quantity: string;
    unit?: string;
    unitPrice: string;
    discount?: string;
    taxRate?: string;
    taxMode?: string;
    netAmount: string;
    itemId?: string;
}

export interface CreditNoteDashboard {
    totalCreditNotes: number;
    totalValue: string;
}

export interface GetAllCreditNotesResponse {
    creditNotes: CreditNoteRow[];
    recordsTotal: number;
}

export interface CreateCreditNotePayload {
    linkedInvoiceId: string;
    reason: CreditNoteReason;
    reasonDetail?: string;
    issueDate: string;
    dueDate?: string;
    currency: string;
    items: CreditNoteItem[];
    subtotal?: number;
    tax?: number;
    discount?: number;
    shippingCost?: number;
    notes?: string;
    termsAndConditions?: string;
}

export interface CreditNoteFormValues {
    linkedInvoiceId: string;
    reason: CreditNoteReason;
    reasonDetail: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    items: CreditNoteItem[];
    subtotal: string;
    tax: string;
    discount: string;
    shippingCost: string;
    notes: string;
    termsAndConditions: string;
    // locked customer fields (read-only)
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    gstNumber: string;
    invoicePrefix: string;
    invoiceNo: string;
    paymentMode: string;
    amountPaid: string;
}
