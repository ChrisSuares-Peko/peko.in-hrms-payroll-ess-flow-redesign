export type TransactionType = 'DOMESTIC' | 'INTERNATIONAL';

export type DocumentType = 'INVOICE' | 'SALES_ORDER' | 'QUOTATION';

export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
export type SalesOrderStatus = 'COMPLETED' | 'PENDING';
export type QuotationStatus = 'ACCEPTED' | 'PENDING' | 'REJECTED';

export const DOC_LABEL: Record<DocumentType, string> = {
    INVOICE: 'Invoice',
    SALES_ORDER: 'Sales Order',
    QUOTATION: 'Quotation',
};

export interface GetAllDocumentsPayload {
    sort?: 'ASC' | 'DESC';
    sortField?: string;
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    documentType?: DocumentType;
    customerId?: string | number;
    invoiceType?: TransactionType;
}

export interface DocumentRow {
    id: string;
    prefix: string;
    documentNumber: string;
    name: string;
    phoneNumber: string;
    createdAt: string;
    totalAmount: string;
    currency?: string;
    transactionType: TransactionType;
    status: InvoiceStatus | SalesOrderStatus | QuotationStatus;
    documentDate: string;
    dueDate: string;
    amountDue: string;
    documentType: DocumentType;
}

export type GetAllDocuments = {
    DocumentData: DocumentRow[];
    recordsTotal: number;
};

export type InvoiceStats = {
    totalInvoices: number;
    totalSales: number;
    totalReceived: number;
    outstandingAmount: number;
};

export type SalesOrderStats = {
    totalOrders: number;
    pending: number;
    completed: number;
};

export type QuotationStats = {
    totalQuotations: number;
    accepted: number;
    pending: number;
};

// Backend Types
interface DocumentRowResponse {
    id: string;
    prefix: string;
    invoiceNumber: string;
    name: string;
    phoneNumber: string;
    createdAt: string;
    totalAmount: string;
    currency?: string;
    invoiceType: TransactionType;
    status: InvoiceStatus | SalesOrderStatus | QuotationStatus;
    invoiceDate: string;
    dueDate: string;
    amountDue: string;
    documentType: DocumentType;
}

export type GetAllDocumentsResponse = {
    invoiceData: DocumentRowResponse[];
    recordsTotal: number;
};
