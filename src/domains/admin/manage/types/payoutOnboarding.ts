export interface AdminPayoutOnboardingRecord {
    id: number;
    credentialId: number;
    corporateName: string | null;
    status: 'pending' | 'active' | 'suspended' | 'rejected';
    pan: string | null;
    panVerifiedAt: string | null;
    bankName: string | null;
    accountNumber: string | null;
    ifsc: string | null;
    accountHolderName: string | null;
    bankVerifiedAt: string | null;
    consentAcceptedAt: string | null;
    activatedAt: string | null;
    phone: string | null;
    businessName: string | null;
    virtualAccountNumber: string | null;
    virtualIfsc: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PayoutOnboardingListResponse {
    data: AdminPayoutOnboardingRecord[];
    recordsTotal: number;
}

export interface PayoutOnboardingListPayload {
    searchText?: string;
    page: number;
    itemsPerPage: number;
    sort?: string;
    sortField?: string;
    from?: string;
    to?: string;
}

export interface UpdatePayoutOnboardingStatusPayload {
    onboardingId: number;
    status: 'active' | 'pending' | 'rejected' | 'suspended';
}
