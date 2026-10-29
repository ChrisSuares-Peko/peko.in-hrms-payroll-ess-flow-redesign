import { LedgerBooksMark } from './ledgerBooks';
import { Posting } from './posting';

export interface PaymentGatewayBalance {
    collected: number;
    received: number;
    fees: number;
    // What the gateway already owed before the portal started recording. Everything from the
    // as-of date onward is read from the journal on top of it.
    opening: number;
    outstanding: number;
    openingBalanceSet?: boolean;
    openingBalanceAsOf?: string | null;
}

export interface PaymentGatewayRow extends PaymentGatewayBalance {
    gatewayAccountId: string;
    gatewayName: string;
    accountType: string | null;
}

export interface PaymentGatewayKpis {
    totalGateways: number;
    outstandingTotal: number;
    awaitingSettlement: number;
    collectedThisMonth: number;
    receivedThisMonth: number;
}

export interface PaymentGatewayListResponse {
    gateways: PaymentGatewayRow[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
    kpis: PaymentGatewayKpis;
    generatedAt: string;
    cached: boolean;
}

export interface PaymentGatewaySummary extends PaymentGatewayBalance {
    transactionCount: number;
    lastReceiptDate: string | null;
    lastReceiptAmount: number | null;
}

export interface PaymentGatewayDetailResponse {
    gateway: PaymentGatewayRow;
    summary: PaymentGatewaySummary;
}

export interface PaymentGatewayTransactionEntry {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    subscriberName: string | null;
    service: string | null;
    paymentMode: string | null;
    totalAmount: number | null;
    gatewayAmount: number | null;
    // The older orders stay listed as history; this says which side of the opening they fall
    // on, so the row never quietly disagrees with the card above it.
    beforeOpening: boolean;
    status: string | null;
    posting: Posting;
}

export interface PaymentGatewaySettlementEntry extends LedgerBooksMark {
    id: number;
    gatewayAccountId: string;
    entryNumber: string;
    settlementId: number | null;
    entryKind: 'RECEIPT' | 'FEE' | 'OPENING';
    entryType: 'ENTRY' | 'REVERSAL';
    amount: number;
    expectedAmount: number | null;
    entryDate: string;
    reference: string | null;
    mode: string;
    note: string | null;
    status: string;
    posting: Posting;
    reversesId: number | null;
    slipKey: string | null;
    slipName: string | null;
    slipFormat: string | null;
    recordedByName: string | null;
    ipAddress?: string | null;
    voidedByName: string | null;
    voidedAt: string | null;
    voidReason: string | null;
    createdAt: string;
}

// Both tables come back in one call, each on its own five-row page, with the card above them.
export interface PaymentGatewaySettlementsResponse extends PaymentGatewayBalance {
    entries: PaymentGatewaySettlementEntry[];
    recordsTotal: number;
    feeEntries: PaymentGatewaySettlementEntry[];
    feeRecordsTotal: number;
    transactionCount: number;
    lastReceiptDate: string | null;
    lastReceiptAmount: number | null;
    page: number;
    feePage: number;
    itemsPerPage: number;
}

export interface PaymentGatewaySettlementSuggestion {
    suggestedAmount: number;
    collected: number;
    received: number;
    fees: number;
    transactionCount: number;
    lastReceiptDate: string | null;
}

export interface PaymentGatewayTabResponse<T> {
    entries: T[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export interface PaymentGatewayTabFilters {
    page: number;
    itemsPerPage: number;
    from: string;
    to: string;
    searchText?: string;
    // Only the tables with a Status filter read these, each its own choices.
    status?: string;
    mode?: string;
    // Received & Bills loads both tables in one call, so the fee table's own search and status
    // travel under their own names.
    feeSearchText?: string;
    feeStatus?: string;
    // Only the Statement of Accounts reads this: debit or credit lines.
    side?: string;
}

export interface PaymentGatewayStatementEntry {
    date: string | null;
    particulars: string;
    reference: string | null;
    entryNumber: string | null;
    type: string;
    debit: number | null;
    credit: number | null;
    balance: number;
    posting: Posting;
}

export interface PaymentGatewayStatementResponse {
    gatewayName: string;
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    entries: PaymentGatewayStatementEntry[];
    recordsTotal: number;
    truncated: boolean;
    page: number;
    itemsPerPage: number;
}

export interface PaymentGatewayOpeningBalancePayload {
    amount: number;
    asOfDate: string;
    note: string;
    slipBase64?: string;
    slipName?: string;
    slipFormat?: string;
}

export interface PaymentGatewaySettlementPayload {
    amount: number;
    entryDate: string;
    reference: string;
    mode: string;
    note: string;
    slipBase64?: string;
    slipName?: string;
    slipFormat?: string;
}

export interface PaymentGatewayFeePayload {
    amount: number;
    entryDate: string;
    reference: string;
    mode: string;
    note: string;
    slipBase64?: string;
    slipName?: string;
    slipFormat?: string;
}
