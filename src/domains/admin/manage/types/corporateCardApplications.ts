export type KybStatus =
    | 'PENDING'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'VERIFIED'
    | 'REJECTED'
    | 'COMPLETED';

// Virtual funding account the corporate transfers money into — a cohesive value object.
export interface VirtualAccount {
    beneficiaryName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    bankName: string | null;
    bankAddress: string | null;
    paymentReference: string | null;
}

// List row (summary). Sensitive numbers masked to last4; virtual-account fields flattened for the table.
export interface CorporateCardApplicationRow {
    corporateId: number;
    companyName: string | null;
    entityName: string | null;
    fullName: string | null;
    pekoAccountNumber: string | null;
    email: string | null;
    kybStatus: KybStatus;
    kybReference: string | null;
    cardSchemeId: number | null;
    svcCardNumberLast4: string | null;
    beneficiaryName: string | null;
    virtualAccountNumberLast4: string | null;
    virtualAccountIfsc: string | null;
    bankName: string | null;
    vendorEmailStatus: boolean | null;
    updatedAt: string;
}

export interface VendorEmailDelivery {
    status: boolean | null;
    sentAt: string | null;
}

// Detail (GET one) — SVC card masked; the virtual account is returned in full for the admin to verify.
export interface CorporateCardApplicationDetail {
    corporateId: number;
    kybStatus: KybStatus;
    kybReference: string | null;
    rejectionReason: string | null;
    cardSchemeId: number | null;
    svcCardNumberLast4: string | null;
    virtualAccount: VirtualAccount;
    vendorEmail: VendorEmailDelivery;
    updatedAt: string | null;
}

export interface ApplicationMutationResult {
    application: CorporateCardApplicationDetail;
    vendorEmailError?: string;
}

export interface ApplicationsListPayload {
    searchText?: string;
    status?: KybStatus | '';
    page: number;
    itemsPerPage: number;
}

export interface ApplicationsListResponse {
    count: number;
    rows: CorporateCardApplicationRow[];
}

// Global overview counts for the dashboard strip above the table (funnel by KYB status).
export interface ApplicationsSummary {
    totalCorporates: number;
    totalApplications: number;
    pending: number;
    completed: number;
    notProvisioned: number;
}

// A corporate with no application yet — the "Add application" picker.
export interface CorporateOption {
    corporateId: number;
    name: string | null;
    username: string | null;
    companyName: string | null;
    email: string | null;
}

// Admin-editable fields. svcCardNumber is the RAW 16-digit value (write-only). virtualAccount is a partial
// value object — omit a field to leave it unchanged, send an empty string to clear it.
export interface UpdateApplicationPayload {
    cardSchemeId?: number | null;
    svcCardNumber?: string;
    kybReference?: string;
    rejectionReason?: string;
    kybStatus?: KybStatus;
    virtualAccount?: Partial<VirtualAccount>;
}
