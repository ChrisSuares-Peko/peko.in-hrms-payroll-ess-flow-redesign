export type AdminComplianceStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'reopened';

export type AdminComplianceAdminStatus =
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'pending'
    | 'reopened';

export interface AdminComplianceDocument {
    id: number;
    name: string;
    url: string;
    uploadedAt: string;
}

export interface AdminComplianceCorporateUser {
    id: number;
    name: string;
    email: string;
    mobileNo: string;
}

export interface AdminComplianceRecord {
    id: number;
    complianceId: string;
    credentialId: number;
    corporateId: number;
    title: string;
    description: string;
    complianceType: string;
    category: string;
    section: string;
    status: AdminComplianceStatus;
    adminStatus: AdminComplianceAdminStatus;
    dueDate: string;
    notes: string;
    adminRemarks: string;
    companyInfo: Record<string, unknown>;
    formData: Record<string, unknown>;
    documents: AdminComplianceDocument[];
    submissionHistory: unknown[];
    createdAt: string;
    updatedAt: string;
    corporateUser: AdminComplianceCorporateUser;
}

export interface AdminComplianceListFilters {
    searchText: string;
    page: number;
    itemsPerPage: number;
    status?: string;
    sort: 'ASC' | 'DESC';
    sortField: string;
    from?: string;
    to?: string;
}

export interface AdminComplianceListResponse {
    rows: AdminComplianceRecord[];
    count: number;
}

export interface AdminComplianceUpdatePayload {
    id: number;
    adminStatus: AdminComplianceAdminStatus;
    adminRemarks?: string;
    rejectedDocumentKeys?: string[];
    rejectedFormFields?: string[];
}
