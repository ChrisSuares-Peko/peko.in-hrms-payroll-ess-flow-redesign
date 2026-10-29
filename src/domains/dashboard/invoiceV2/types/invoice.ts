import { InvoiceType } from './index';

export interface InvoiceRow {
    id: string;
    prefix: string;
    invoiceNumber: string;
    name: string;
    cashSale?: boolean;
    gstNumber?: string;
    phoneNumber: string;
    createdAt: string;
    totalAmount: string;
    // As-entered figure for a foreign-currency invoice — totalAmount/amountDue above are
    // the INR-equivalent (for internal stats); always display these when present.
    originalTotalAmount?: string;
    invoiceType: string;
    currency?: string;
    status: 'Paid' | 'Pending' | 'Overdue' | 'Refund Due' | 'Refunded';
    invoiceDate: string;
    dueDate: string;
    amountDue: string;
    originalAmountDue?: string;
    recurringId?: string | null;
    recurring?: { id: string; status: string } | null;
}

export type InvoiceStats = {
    totalInvoices: string;
    totalPaid: string;
    totalDue: string;
};

export type GetAllInvoicesResponse = {
    invoiceData: InvoiceRow[];
    recordsTotal: number;
};

export interface GetInvoiceByIdResponse {
    id: string;
    invoiceType: InvoiceType;
    prefix: string;
    invoiceNumber: string;
    currency: string;
    conversionRate?: number;
    invoiceDate: string;
    dueDate: string;
    dateOfSupply?: string;
    createdAt?: string;
    updatedAt?: string;
    cashSale?: boolean;
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
        // As-entered figures for a foreign-currency invoice — unitPrice/netAmount above
        // are the INR-equivalent (for internal stats); always display these when present.
        originalUnitPrice?: string;
        discount: string;
        taxRate: string;
        taxMode: 'Exclusive' | 'Inclusive';
        netAmount: string;
        originalNetAmount?: string;
        productId?: string;
        itemId?: string;
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
    // As-entered figures for a foreign-currency invoice — the fields above are the
    // INR-equivalent (for internal stats); always display these when present.
    originalSubtotal?: string;
    originalDiscount?: string;
    originalTax?: string;
    originalTotalAmount?: string;
    originalAmountPaid?: string;
    originalAmountDue?: string;
    status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED' | 'ACCEPTED' | 'REFUNDED' | 'CONVERTED';
    paymentDate?: string;
    documentType?: 'INVOICE' | 'SALES_ORDER' | 'QUOTATION' | 'CREDIT_NOTE';
    isCreditNoteCreated?: boolean;
    linkedInvoiceId?: string;
    creditNoteDetails?: {
        reason?: string;
        additionalDetails?: string;
        linkedInvoiceNumber?: string;
        linkedInvoicePrefix?: string;
    };
}

export interface GetAllInvoicesPayload {
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    invoiceType?: 'DOMESTIC' | 'INTERNATIONAL';
    hasEInvoice?: boolean;
    documentType?: 'INVOICE' | 'QUOTATION' | 'CREDIT_NOTE';
    linkedInvoiceId?: string;
}

export type QuotationDashboard = {
    totalQuotations: number;
    accepted: number;
    pending: number;
};
