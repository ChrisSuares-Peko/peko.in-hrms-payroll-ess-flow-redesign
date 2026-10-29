export type EInvoiceRegisterStatus = 'Active' | 'Cancelled';
export type EInvoiceRegisterTab = 'all' | 'active' | 'cancelled';

export interface EInvoiceRegisterRow {
    id: string;
    date: string;
    document: string;
    buyerName: string;
    buyerGstin: string;
    irnHash: string;
    irnAck: string;
    supply: string;
    amount: string;
    taxableAmount: string;
    status: EInvoiceRegisterStatus;
    ewb: string;
}

export interface EInvoiceRegisterStats {
    total: number;
    active: number;
    cancelled: number;
    activeValue: string;
}

export interface EInvoiceRegisterFilters {
    searchText: string;
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField: string;
    from: string;
    to: string;
    status: string;
    supplyType: string;
}

export interface GetEInvoiceAllParams {
    page: number;
    itemsPerPage: number;
    searchText?: string;
    status?: string;
    supplyType?: string;
    sort: string;
    sortField: string;
    from: string;
    to: string;
    hasEwaybill?: boolean;
}

export interface EInvoiceApiItem {
    id: number;
    irn: string;
    ackNo: string;
    supplyType: string;
    docType: string;
    prefix: string | null;
    docNo: string;
    docDate: string;
    buyerGstin: string;
    buyerDetails: {
        legalName: string;
        gstin: string;
    };
    totalTaxableValue: string | number;
    totalAmount: string | number;
    status: string;
    eWaybillId: string | number | null;
}

export interface EInvoiceAllApiResponse {
    eInvoices: EInvoiceApiItem[];
    recordsTotal: number;
    activeCount: number;
    cancelledCount: number;
}
