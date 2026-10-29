import { InvoiceStatus, QuotationStatus, SalesOrderStatus, TransactionType } from './documents';

export interface InfoRow {
    label: string;
    value?: string;
    isBadge?: boolean;
    isMultiline?: boolean;
}

export type DomesticPaymentKey = 'payment-link' | 'upi' | 'bank' | 'enach';
export type InternationalPaymentKey = 'virtual-iban' | 'currency-account';
export type CollectPaymentKey = DomesticPaymentKey | InternationalPaymentKey;

export interface PaymentMethod {
    key: CollectPaymentKey;
    label: string;
    iconBg: string;
    icon: string;
    disabled?: boolean;
}

export interface GetDocumentById {
    id: string;
    transactionType: TransactionType;
    prefix: string;
    documentNumber: string;
    currency: string;
    documentDate: string;
    dueDate: string;
    // buyer
    customerId?: string;
    name: string;
    gstNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    email: string;
    phoneNumber: string;
    // items
    items: {
        name: string;
        hsn: string;
        quantity: string;
        unit: string;
        unitPrice: string;
        discount: string;
        taxRate: string;
        taxMode?: 'Exclusive' | 'Inclusive';
        netAmount: string;
    }[];
    // additional
    termsAndConditions: string;
    notes: string;
    shippingCost: string;
    amountPaid: string;
    paymentMode: string;

    subtotal: string;
    discount: string;
    tax: string;
    totalAmount: string;
    amountDue: string;
    status: InvoiceStatus | SalesOrderStatus | QuotationStatus;
    paymentDate?: string;
    // HTML render of the document, returned by the shared invoicing/v2
    // by-id endpoint alongside the structured fields above.
    invoiceHtml?: string;
}

// Backend Types
export interface GetDocumentByIdResponse {
    id: string;
    invoiceType: TransactionType;
    prefix: string;
    invoiceNumber: string;
    currency: string;
    invoiceDate: string;
    dueDate: string;
    // buyer
    customerId?: string;
    name: string;
    gstNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    email: string;
    phoneNumber: string;
    // items
    items: {
        name: string;
        hsn: string;
        quantity: string;
        unit: string;
        unitPrice: string;
        discount: string;
        taxRate: string;
        taxMode?: 'Exclusive' | 'Inclusive';
        netAmount: string;
    }[];
    // additional
    termsAndConditions: string;
    notes: string;
    shippingCost: string;
    amountPaid: string;
    paymentMode: string;

    subtotal: string;
    discount: string;
    tax: string;
    totalAmount: string;
    amountDue: string;
    status: InvoiceStatus | SalesOrderStatus | QuotationStatus;
    paymentDate?: string;
    invoiceHtml?: string;
}
