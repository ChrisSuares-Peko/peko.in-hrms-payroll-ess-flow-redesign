import { InvoiceType } from './index';

export type BuyerValues = {
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
    saveCustomer: boolean;
};

export type InvoiceValues = {
    type: InvoiceType;
    invoicePrefix: string;
    invoiceNumber: string;
    currency: string;
    // Manually entered; required only when currency isn't INR. No live FX lookup —
    // the user types the rate they actually billed at (matches Peko-AE's pattern).
    exchangeRate: string;
    invoiceDate: string;
    dueDate: string;
    dateOfSupply: string | null;
    isCashSale: boolean;
};

export type ItemValues = {
    name: string;
    hsn: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    discount: string;
    taxRate: string;
    taxMode: 'Exclusive' | 'Inclusive';
    netAmount: string;
    productId?: string;
    itemId?: string;
};

export type AdditionalValues = {
    termsAndConditions: string;
    notes: string;
    shippingCost: string;
    amountPaid: string;
    paymentMode: string;
    signature: File | null;
    removeSignature: boolean;
};

export type CreditNoteValues = {
    reason: string;
    reasonDetail: string;
};

export type CreateInvoiceFormValues = {
    buyer: BuyerValues;
    invoice: InvoiceValues;
    items: ItemValues[];
    additional: AdditionalValues;
    creditNote?: CreditNoteValues;
};

export type CustomerOption = {
    id: number;
    name: string;
    gstin?: string;
    primaryAddress: string;
    primaryCity: string;
    primaryState: string;
    primaryPincode: string;
    primaryCountry: string;
    email: string;
    phoneNumber: string;
    currency?: string;
};

export type CreateInvoicePayload = {
    userId: number;
    userType: string;

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
    saveCustomer: boolean;

    // invoice
    invoiceType: InvoiceType;
    prefix: string;
    invoiceNumber: string;
    currency: string;
    conversionRate?: number;
    invoiceDate: string;
    dueDate: string;
    dateOfSupply: string | null;

    // items
    items: ItemValues[];

    // additional
    termsAndConditions: string;
    notes: string;
    shippingCost: string;
    amountPaid: string;
    paymentMode: string;

    // computed
    subtotal: string;
    discount: string;
    tax: string;
    totalAmount: string;

    autoUpdateDocumentNumber: boolean;
    taxType: 'Intra-State' | 'Inter-State' | null;
    documentType?: 'INVOICE' | 'QUOTATION';
    isCashSale: boolean;
};
