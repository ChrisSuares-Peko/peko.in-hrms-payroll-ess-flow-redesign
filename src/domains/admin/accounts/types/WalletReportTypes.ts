import { CorporateUser } from '../../settings/types/disabledTypes';

type payload = {
    userId: number;
    userType: string;
};

export type walletReportListing = payload & {
    fromDate?: string;
    toDate?: string;
    sort: 'ASC' | 'DESC';
    page: number;
    searchText?: string;
    corporateId?: string;
    sortField?: string;
};

export type Reports = {
    id: number;
    corporateTxnId: string;
    transactionId: number | null;
    transactionDate: string;
    transactionType: string;
    transactionCategory: string;
    debitAmount: string;
    creditAmount: string;
    totalCashback: string;
    corporateCashback: string;
    systemCashback: string;
    balance: string;
    remarks: string;
    status: string | null;
    providerId: string;
    commissionDetails: any; // Define a specific type if possible
    createdAt: string;
    updatedAt: string;
    serviceOperatorId: number | null;
    credentialId: number;
    orderId: number | null;
    journalRecordStatus?: { walletTransfer?: boolean } | null;
    journalData?: {
        walletTransfer?: {
            reason?: string;
            skipped?: boolean;
            journalDate?: string;
            referenceNumber?: string;
            notes?: string;
            accountNames?: Record<string, string>;
            lineItems?: {
                accountId: string;
                direction: 'debit' | 'credit';
                amount: number | string;
            }[];
        };
    } | null;
    credential: {
        name: string;
        username?: string;
    };
};

export type walletListingResponse = {
    data: Reports[];
    recordsTotal: number;
    recordsFiltered: number;
};

export type CorporateListResponse = {
    result: CorporateUser[];
};
