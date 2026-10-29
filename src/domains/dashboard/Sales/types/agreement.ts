export type AgreementStatus = 'Draft' | 'Sent' | 'Signed' | 'Active' | 'Expiring soon' | 'Pending';

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    initials: string;
    status: 'Active' | 'Inactive';
    contactPerson: string;
    address: string;
}

export interface AgreementRow {
    id: string;
    displayId: string;
    customer: string;
    quotationId?: number | null;
    quotationPrefix?: string | null;
    quotationInvoiceNumber?: string | null;
    startDate: string;
    value: number;
    lastUpdated: string;
    status: AgreementStatus;
    hasDocument: boolean;
    documentUrl?: string | null;
    title?: string;
    contractType?: string;
    currency?: string;
    paymentTerms?: string;
    description?: string;
    rawStartDate?: string;
}

// ── Get-all agreements ────────────────────────────────────────────────────────

export interface GetAllAgreementsPayload {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    status?: string;
    customerId?: number;
    sortField?: string;
    sort?: 'ASC' | 'DESC';
}

export interface AgreementApiItem {
    id: number;
    customerId: number;
    quotationId: number | null;
    agreementNumber: string;
    prefix: string;
    title: string;
    contractType: string;
    currency: string;
    paymentTerms: string;
    startDate: string | null;
    description: string;
    documentUrl: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    corporateUserId: number;
    subCorporateUserId: number | null;
    corporateUser: {
        name: string;
        email: string;
        mobileNo: string;
        gstNumber: string | null;
        logo: string | null;
    } | null;
    invoiceCustomerV2: {
        id: number;
        name: string;
        email: string;
        phoneNumber: string;
        gstin: string | null;
        primaryAddress: string | null;
        primaryCity: string | null;
        primaryState: string | null;
        primaryPincode: string | null;
        primaryCountry: string | null;
    } | null;
    quotation: {
        id: number;
        invoiceNumber: string;
        prefix: string | null;
    } | null;
    subCorporateUser: {
        id: number | null;
        name: string | null;
    } | null;
    eSign?: {
        id: number;
        status: string;
        signers_info: SignerInfo[];
    } | null;
    timeline?: Array<{
        createdAt: string;
        eventName: string;
    }>;
}

export interface AgreementStatusCounts {
    total: number;
    draft: number;
    sent: number;
    signed: number;
    active: number;
    expiringSoon: number;
    pending: number;
}

export interface GetAllAgreementsResponse {
    agreements: AgreementApiItem[];
    recordsTotal: number;
    statusCounts: AgreementStatusCounts;
}

export interface CreateAgreementPayload {
    customerId: number;
    quotationId?: number;
    title: string;
    contractType: string;
    currency: string;
    paymentTerms?: string;
    startDate: string;
    description?: string;
}

export interface UpdateAgreementPayload {
    customerId?: number;
    quotationId?: number;
    title?: string;
    contractType?: string;
    currency?: string;
    paymentTerms?: string;
    startDate?: string;
    description?: string;
}
export interface AgreementDetailsFormValues {
    title: string;
    contractType: string;
    paymentTerms: string;
    currency: string;
    startDate: string;
    description: string;
}

export interface CreateAgreementResponse {
    id: number;
    customerId: number;
    quotationId?: number;
    agreementNumber: string;
    prefix: string;
    title: string;
    contractType: string;
    currency: string;
    paymentTerms: string;
    startDate: string;
    description: string;
    corporateUserId: number;
    status: string;
    updatedAt: string;
    createdAt: string;
}

export interface SignerPosition {
    page: number;
    page_height: number;
    page_width: number;
    x1: number;
    x2: number;
    y1: number;
    y2: number;
}

export interface SignerInfo {
    page_number: string[];
    sequence: number;
    signer_email: string;
    signer_mobile: string;
    signer_name: string;
    signer_position: SignerPosition[];
}

export interface SendSignRequestPayload {
    docket_title: string;
    documentBase64: string;
    expiry_date: string;
    initiator_email: string;
    initiator_name: string;
    reminder: boolean;
    sequentialSignature: boolean;
    sourceType: 'AGREEMENT';
    sourceId: number;
    signers_info: SignerInfo[];
    termsofUse: boolean;
}

export interface QuotationLineItem {
    name: string;
    quantity: string;
    unitPrice: string;
    netAmount: string;
    taxRate: string;
    discount: string;
    hsn?: string;
    unit?: string;
}

export interface QuotationOption {
    id: string;
    displayId: string;
    customer: string;
    date: string;
    amount: number;
    status: string;
    rawId: number;
    subtotal: number;
    tax: number;
    discount: number;
    items: QuotationLineItem[];
}
