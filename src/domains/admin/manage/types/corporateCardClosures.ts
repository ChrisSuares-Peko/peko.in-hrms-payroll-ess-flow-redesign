export type ClosureRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface ClosureAppliedResult {
    cards?: { requested: number; frozen: number; failed: number; vendorUnavailable?: boolean };
    kybReset?: boolean;
    appliedAt?: string;
    error?: string;
}

export interface ClosureRequestRow {
    id: string;
    corporateId: number;
    companyName: string | null;
    email: string | null;
    status: ClosureRequestStatus;
    reason: string;
    reasonLabel: string;
    details: string | null;
    requestedByName: string | null;
    requestedAt: string;
    decidedAt: string | null;
    decisionNote: string | null;
    appliedResult: ClosureAppliedResult | null;
}

export interface ClosureRequestsListPayload {
    status?: ClosureRequestStatus | '';
    page: number;
    itemsPerPage: number;
}

export interface ClosureRequestsListResponse {
    count: number;
    rows: ClosureRequestRow[];
}
