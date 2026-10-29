export type CreditNoteReason =
    | 'GOODS_RETURNED'
    | 'OVERCHARGE'
    | 'SERVICE_CANCELLED'
    | 'DISCOUNT'
    | 'OTHER';

export type CreditNoteStatus = 'DRAFT' | 'SENT' | 'APPLIED' | 'CANCELLED';

export interface CreditNoteItem {
    name: string;
    hsn?: string;
    quantity: string;
    unit?: string;
    unitPrice: string;
    discount?: string;
    taxRate?: string;
    netAmount: string;
    itemId?: string;
}

export interface CreditNoteRow {
    id: string;
    creditNoteNumber: string;
    prefix?: string;
    linkedInvoiceId: string;
    reason: CreditNoteReason;
    reasonDetail?: string;
    customerName: string;
    customerEmail?: string;
    status: CreditNoteStatus;
    currency: string;
    totalAmount: string;
    amountDue: string;
    issueDate: string;
    dueDate?: string;
    createdAt: string;
    items?: CreditNoteItem[];
}

export const CREDIT_NOTE_REASON_LABELS: Record<string, string> = {
    GOODS_RETURNED: 'Goods Returned',
    OVERCHARGE: 'Overcharge',
    SERVICE_CANCELLED: 'Service Cancelled',
    DISCOUNT: 'Discount Applied',
    OTHER: 'Other',
};