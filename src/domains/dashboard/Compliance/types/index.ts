export interface ComplianceItem {
    id: number;
    complianceId: string;
    title: string;
    description: string;
    complianceType: string;
    category: 'one-time' | 'recurring';
    section: string;
    status: 'pending' | 'processing' | 'completed';
    adminStatus?: 'pending' | 'under_review' | 'approved' | 'rejected' | 'reopened' | null;
    dueDate: string | null;
    notes: string | null;
    adminRemarks?: string | null;
    documents: ComplianceDocument[];
    submissionHistory: { status: string; timestamp: string; remarks?: string | null; fileName?: string | null }[];
    createdAt: string;
    updatedAt: string;
}

export interface ComplianceListApiPayload {
    page: number;
    pageSize: number;
    searchText: string;
    from: string;
    to: string;
    status?: string;
}

export interface ComplianceListApiResponse {
    recordsTotal: number;
    rows: ComplianceItem[];
}

export interface ComplianceDetailApiPayload {
    id: number;
}

export interface ComplianceDetailApiResponse extends ComplianceItem {
    complianceId: string;
    documents: ComplianceDocument[];
    notes: string;
    adminRemarks?: string;
    adminStatus?: 'under_review' | 'approved' | 'rejected' | 'reopened' | null;
    rejectedDocumentKeys?: string[];
    rejectedFormFields?: string[];
    formData?: Record<string, unknown>;
}

export interface ComplianceDocument {
    id: number | string;
    key?: string;
    name: string;
    url: string;
    uploadedAt: string;
}

export type ComplianceStatus = ComplianceItem['status'];

export type useComplianceFilter = {
    searchText: string;
    page: number;
    pageSize: number;
    from: string;
    to: string;
    status?: string;
};

export type BackendComplianceType = 'MCA' | 'GST' | 'TDS' | 'EPF_ESI' | 'INC20A' | 'BANK_ACCOUNT' | 'PT' | 'AUDIT';
export type ComplianceSection = 'tax-financial' | 'corporate-governance';

export const COMPLIANCE_TYPE_MAP: Record<string, BackendComplianceType> = {
    EPF_ESI_REGISTRATION: 'EPF_ESI',
    EPF_ESI_RETURN_FILING: 'EPF_ESI',
    GST_REGISTRATION: 'GST',
    GST_RETURN_FILING: 'GST',
    TDS_REGISTRATION: 'TDS',
    TDS_RETURN_FILING: 'TDS',
    MCA_ADT1: 'MCA',
    MCA_ANNUAL: 'MCA',
    MCA_DIR3KYC: 'MCA',
    MCA_DPT3: 'MCA',
    MCA_MSME1: 'MCA',
    MCA_OTHER: 'MCA',
    INC20A: 'INC20A',
    BANK_ACCOUNT: 'BANK_ACCOUNT',
    PT: 'PT',
    AUDIT: 'AUDIT',
};

export interface ComplianceSubmitPayload {
    title: string;
    complianceType: string;
    category: string;
    section: ComplianceSection;
    dueDate?: string;
    formData: Record<string, unknown>;
}

export interface ComplianceDashboardSummary {
    total: number;
    approved: number;
    pending: number;
    overdue: number;
    dueSoon: number;
    upcoming: number;
    healthScore: number;
}

export type ComplianceFormType =
    | 'EPF_ESI_REGISTRATION'
    | 'EPF_ESI_RETURN_FILING'
    | 'GST_REGISTRATION'
    | 'GST_RETURN_FILING'
    | 'TDS_REGISTRATION'
    | 'TDS_RETURN_FILING'
    | 'MCA_ADT1'
    | 'MCA_ANNUAL'
    | 'MCA_DIR3KYC'
    | 'MCA_DPT3'
    | 'MCA_MSME1'
    | 'MCA_OTHER'
    | 'INC20A'
    | 'BANK_ACCOUNT'
    | 'PT'
    | 'AUDIT';
