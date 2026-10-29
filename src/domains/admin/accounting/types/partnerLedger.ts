import { LedgerBooksMark } from './ledgerBooks';
import { Posting } from './posting';

export interface PartnerBalance {
    earned: number;
    paid: number;
    // Debit notes raised against the partner, net of any reversed. They take back part of
    // what was earned, so they settle what is owed the way a payout does.
    debitNotes: number;
    // What Peko already owed before the portal started recording. Everything from the as-of
    // date onward is read from the journal on top of it.
    opening: number;
    owed: number;
    openingBalanceSet?: boolean;
    openingBalanceAsOf?: string | null;
}

export interface PartnerLedgerRow extends PartnerBalance {
    credentialId: number;
    systemUserId: number;
    partnerName: string;
    branding: string | null;
    portalUrl: string | null;
    sharePercentage: number | null;
    isActive: boolean;
}

export interface PartnerLedgerKpis {
    totalPartners: number;
    owedTotal: number;
    awaitingPayout: number;
    partnersWithoutShare: number;
    earnedThisMonth: number;
    paidThisMonth: number;
    gmvThisMonth: number;
}

export interface PartnerLedgerListResponse {
    partners: PartnerLedgerRow[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
    kpis: PartnerLedgerKpis;
    partnershipAccountConfigured: boolean;
    generatedAt: string;
    cached: boolean;
}

export interface PartnerSummary extends PartnerBalance {
    gmv: number;
    lastPayoutDate: string | null;
    lastPayoutAmount: number | null;
    partnershipAccountConfigured: boolean;
}

export interface PartnerLedgerDetailResponse {
    partner: PartnerLedgerRow;
    summary: PartnerSummary;
    partnershipAccountConfigured: boolean;
    gstRate?: number;
}

export interface PartnerTransactionEntry {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    subscriberName: string | null;
    service: string | null;
    totalAmount: number | null;
    netPlatformFee: number | null;
    netCommission: number | null;
    couponTotal: number | null;
    gatewayCharge: number | null;
    shareBase: number | null;
    shareExcludingGST: number | null;
    shareGST: number | null;
    partnerShare: number | null;
    sharePercentageApplied: number | null;
    status: string | null;
    posting: Posting;
}

export interface PartnerSubscriptionEntry {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    subscriberName: string | null;
    planName: string | null;
    billingType: string | null;
    subscriptionStatus: string | null;
    addOn: boolean;
    totalAmount: number | null;
    netRevenue: number | null;
    couponTotal: number | null;
    gatewayCharge: number | null;
    shareBase: number | null;
    shareExcludingGST: number | null;
    shareGST: number | null;
    partnerShare: number | null;
    sharePercentageApplied: number | null;
    status: string | null;
    posting: Posting;
}

export interface PartnerPayoutEntry extends LedgerBooksMark {
    id: number;
    partnerCredentialId: number;
    entryNumber: string;
    amount: number;
    calculatedAmount: number | null;
    difference: number | null;
    payoutDate: string;
    reference: string | null;
    mode: string;
    note: string | null;
    status: 'ACTIVE' | 'VOIDED';
    posting: Posting;
    entryKind: 'PAYOUT' | 'OPENING';
    entryType: 'PAYOUT' | 'REVERSAL';
    reversesId: number | null;
    slipKey: string | null;
    slipName: string | null;
    slipFormat: string | null;
    recordedByName: string | null;
    ipAddress?: string | null;
    voidedByName: string | null;
    voidReason: string | null;
}

export interface PartnerPayoutsResponse {
    entries: PartnerPayoutEntry[];
    recordsTotal: number;
    owed: number;
    earned: number;
    paid: number;
    debitNotes: number;
    opening: number;
    lastPayoutDate: string | null;
    lastPayoutAmount: number | null;
    openingBalanceSet?: boolean;
    openingBalanceAsOf?: string | null;
    page: number;
    itemsPerPage: number;
}

export interface PartnerOpeningBalancePayload {
    amount: number;
    asOfDate: string;
    note: string;
    slipBase64?: string;
    slipName?: string;
    slipFormat?: string;
}

export interface PartnerPayoutSuggestion {
    suggestedAmount: number;
    earned: number;
    paid: number;
    debitNotes: number;
    lastPayoutDate: string | null;
}

export interface PartnerDebitNoteEntry extends LedgerBooksMark {
    id: number;
    partnerCredentialId: number;
    entryNumber: string;
    kind: 'DEBIT_NOTE';
    reference: string;
    amount: number;
    gstInclusive?: boolean;
    gstRate?: number | null;
    taxableAmount?: number | null;
    gstAmount?: number | null;
    issueDate: string;
    reason: string | null;
    againstCorporateTxnId: string | null;
    status: 'OPEN' | 'VOIDED';
    posting: Posting;
    entryType: 'ENTRY' | 'REVERSAL';
    reversesId: number | null;
    source: 'MANUAL';
    slipKey: string | null;
    slipName: string | null;
    slipFormat: string | null;
    recordedByName: string | null;
    ipAddress?: string | null;
    voidedByName: string | null;
    voidReason: string | null;
}

export interface PartnerDebitNotePayload {
    amount: number;
    gstInclusive: boolean;
    issueDate: string;
    reason: string;
    againstCorporateTxnId: string;
    slipBase64?: string;
    slipName?: string;
    slipFormat?: string;
}

export interface PartnerLedgerTabResponse<T> {
    entries: T[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export interface PartnerLedgerTabFilters {
    page: number;
    itemsPerPage: number;
    from?: string;
    to?: string;
    searchText?: string;
    // Only the tabs with a Status filter read these, each its own choices.
    status?: string;
    mode?: string;
    // Only the Statement of Accounts reads this: debit or credit lines.
    side?: string;
}

export interface PartnerStatementEntry {
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

export interface PartnerStatementResponse {
    partnerName: string;
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    entries: PartnerStatementEntry[];
    recordsTotal: number;
    truncated: boolean;
    page: number;
    itemsPerPage: number;
}

export interface PartnerPayoutPayload {
    amount: number;
    payoutDate: string;
    reference: string;
    mode: string;
    note: string;
    slipBase64?: string;
    slipName?: string;
    slipFormat?: string;
}
