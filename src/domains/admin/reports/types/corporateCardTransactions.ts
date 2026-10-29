export interface CorporateCardTransactionRow {
    id: number;
    displayId: string | null;
    transactionUniqueId: string;
    notificationUniqueId: string | null;
    corporateId: number | null;
    corporateName: string | null;
    userId: string | null;
    cardholderName: string | null;
    cardIssuanceId: string | null;
    cardLast4: string | null;
    maskedCardNumber: string | null;
    referenceNumber: string | null;
    externalCardIdentifier: string | null;
    eventType: string;
    transactionType: number | null;
    transactionMode: number | null;
    transactionAmount: number;
    issuerWalletBalance: number | null;
    merchantName: string | null;
    merchantCity: string | null;
    merchantCategoryCode: string | null;
    category: string | null;
    decision: string | null;
    declineReason: string | null;
    internalStatus: string;
    status: string;
    approval: string;
    createdAt: string;
    notifiedAt: string | null;
}

export interface CorporateCardTransactionDetail extends CorporateCardTransactionRow {
    rawAuthPayload: Record<string, unknown> | null;
    rawNotifyPayload: Record<string, unknown> | null;
}

export interface CorporateCardTransactionFilters {
    corporateId?: number;
    cardLast4?: string;
    decision?: string;
    internalStatus?: string;
    transactionType?: number;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    searchText?: string;
    page: number;
    itemsPerPage: number;
}

export interface CorporateCardTransactionListResponse {
    count: number;
    rows: CorporateCardTransactionRow[];
}

export interface TransactedCorporateOption {
    corporateId: number;
    name: string;
}
