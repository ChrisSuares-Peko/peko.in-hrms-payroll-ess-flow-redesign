export interface OnboardVirtualAccountPayload {
    name: string;
    pan: string;
    mobile: string;
}

export interface VirtualAccountRecord {
    _id: string;
    corporateUser: string;
    decentroCustomerId: string | null;
    decentroTxnId: string | null;
    virtualAccountNumber: string | null;
    virtualAccountIfsc: string | null;
    bankCode: string | null;
    name: string | null;
    pan: string | null;
    mobile: string | null;
    status: string | null;
    responseCode: string | null;
    message: string | null;
    providerResponse: unknown;
    createdAt: string;
    updatedAt: string;
}

export interface VirtualAccountBalance {
    virtualAccountNumber: string;
    virtualAccountIfsc: string | null;
    accountName: string | null;
    availableBalance: number | null;
    providerData: unknown;
}

export interface RemoveFundsPayload {
    amount: number;
    transferType?: 'IMPS' | 'NEFT' | 'RTGS';
    remarks?: string;
}

export interface RemoveFundsResponse {
    referenceId: string;
    amount: number;
    transferType: string;
    status: 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED';
    decentroTxnId: string | null;
    availableBalance?: number | null;
    beneficiaryAccountNumber: string | null;
    beneficiaryIfsc: string | null;
    createdAt: string;
}

export interface RemoveFundsRequestRow extends RemoveFundsResponse {
    id?: string;
}

export interface RemoveFundsListResponse {
    rows: RemoveFundsRequestRow[];
    count: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaymentVirtualAccountBalanceData {
    virtualAccountNumber: string;
    accountName: string | null;
    ifsc: string | null;
    balance: number | null;
    providerData: Record<string, unknown>;
}
