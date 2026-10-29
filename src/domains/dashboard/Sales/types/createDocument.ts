import { DocumentType, TransactionType } from './documents';

type BuyerValues = {
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

type DocumentValues = {
    type: TransactionType;
    documentPrefix: string;
    documentNumber: string;
    currency: string;
    documentDate: string;
    dueDate: string;
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

type AdditionalValues = {
    termsAndConditions: string;
    notes: string;
    shippingCost: string;
    amountPaid: string;
    paymentMode: string;
    signature?: File | null;
    removeSignature?: boolean;
};

export type CreateDocumentFormValues = {
    buyer: BuyerValues;
    document: DocumentValues;
    items: ItemValues[];
    additional: AdditionalValues;
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
};

// Backend Types
export type CreateDocumentPayload = {
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
    invoiceType: TransactionType;
    prefix: string;
    invoiceNumber: string;
    currency: string;
    invoiceDate: string;
    dueDate: string;

    // items
    items: ItemValues[];

    // additional
    termsAndConditions: string;
    notes: string;
    shippingCost: string;
    amountPaid: string;
    paymentMode: string;

    documentType?: DocumentType;
    taxType: 'Intra-State' | 'Inter-State' | null;

    // computed
    subtotal: string;
    discount: string;
    tax: string;
    totalAmount: string;
};
