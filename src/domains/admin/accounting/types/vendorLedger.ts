import { LedgerBooksMark } from './ledgerBooks';
import { Posting } from './posting';

export interface VendorBalance {
    deposited: number;
    creditNotes: number;
    manualCommission: number;
    used: number;
    commission: number;
    available: number;
    openingBalanceSet: boolean;
    openingBalanceAsOf?: string | null;
}

export interface VendorLedgerRow extends VendorBalance {
    id: number;
    vendorName: string;
    type: string | null;
    gstNo: string | null;
    isActive: boolean;
    services: string[];
    serviceCount: number;
    lowBalance: boolean;
}

export interface VendorLedgerKpis {
    totalVendors: number;
    depositsHeld: number;
    lowBalanceVendors: number;
    depositedThisMonth: number;
    usedThisMonth: number;
    commissionThisMonth: number;
    openCreditNotes: number;
    lowBalanceThreshold: number;
}

export interface VendorLedgerListResponse {
    vendors: VendorLedgerRow[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
    kpis: VendorLedgerKpis;
    vendorDepositsAccountConfigured: boolean;
    generatedAt: string;
    cached: boolean;
}

export interface VendorLedgerDetailResponse {
    vendor: VendorLedgerRow;
    summary: VendorLedgerSummary;
    vendorDepositsAccountConfigured: boolean;
    gstRate?: number;
}

export interface VendorLedgerSummary extends VendorBalance {
    openingBalance: number;
    totalTransaction: number;
}

export type VendorEntrySource = 'ORDER' | 'MANUAL' | 'AUTO';

export type VendorSellingMode =
    | 'MARGIN'
    | 'AGENT_MARKUP'
    | 'PRINCIPAL_MARKUP'
    | 'MIXED'
    | 'OWN_REVENUE';

export interface VendorTransactionEntry {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    service: string | null;
    customer: string | null;
    vendorAmount: number | null;
    commission: number | null;
    markup: number | null;
    receivable: number | null;
    commissionMode: VendorSellingMode | null;
    status: string | null;
    refunded: boolean;
    paymentMode: string | null;
    posting: Posting;
}

export interface VendorCommissionEntry extends LedgerBooksMark {
    id: number;
    source: VendorEntrySource;
    entryNumber: string | null;
    corporateTxnId: string | null;
    reference: string | null;
    transactionDate: string;
    service: string | null;
    reason: string | null;
    againstCorporateTxnId?: string | null;
    orderAmount: number | null;
    commissionExcludingGST: number | null;
    commissionIncludingGST: number | null;
    commissionGST?: number | null;
    principalMarkup?: number | null;
    commissionReversed: number | null;
    commissionNet: number | null;
    refunded: boolean;
    posting: Posting;
    status: string | null;
    entryType: string | null;
    recordedByName: string | null;
    ipAddress?: string | null;
    hasDocument: boolean;
    gstInclusive?: boolean;
    gstRate?: number | null;
    taxableAmount?: number | null;
    gstAmount?: number | null;
}

export interface VendorSlip {
    slipKey: string | null;
    slipName: string | null;
    slipFormat: string | null;
}

export type VendorDepositEntryType = 'DEPOSIT' | 'OPENING' | 'REVERSAL';

export interface VendorDepositEntry extends VendorSlip, LedgerBooksMark {
    id: number;
    entryNumber: string;
    amount: number;
    depositDate: string;
    reference: string | null;
    mode: string;
    note: string | null;
    status: 'ACTIVE' | 'VOIDED';
    posting: Posting;
    entryType: VendorDepositEntryType;
    reversesId: number | null;
    recordedByName: string | null;
    ipAddress?: string | null;
    voidedByName: string | null;
    voidReason: string | null;
}

export type VendorEntryKind = 'CREDIT_NOTE' | 'COMMISSION' | 'COST_OF_SALES' | 'DEBIT_NOTE';

export interface VendorCreditNoteEntry extends VendorSlip, LedgerBooksMark {
    id: number | null;
    kind: VendorEntryKind;
    source: 'MANUAL' | 'AUTO';
    entryNumber: string | null;
    reference: string;
    amount: number;
    issueDate: string;
    reason: string | null;
    againstCorporateTxnId: string | null;
    status: 'OPEN' | 'VOIDED';
    posting: Posting;
    entryType: 'ENTRY' | 'REVERSAL';
    reversesId: number | null;
    recordedByName: string | null;
    ipAddress?: string | null;
    voidedByName: string | null;
    voidReason: string | null;
    hasDocument: boolean;
    gstInclusive?: boolean;
    gstRate?: number | null;
    taxableAmount?: number | null;
    gstAmount?: number | null;
}

export type VendorCostOfSalesEntry = VendorCreditNoteEntry & {
    kind: 'COST_OF_SALES';
    source: 'MANUAL';
};

export type VendorDebitNoteEntry = VendorCreditNoteEntry & {
    kind: 'DEBIT_NOTE';
    source: 'MANUAL';
};

export type VendorTaxDocumentTab = 'commissions' | 'credit-notes';

export type VendorTaxDocumentSource = 'order' | 'auto' | 'manual';

export type VendorLedgerEntry =
    | VendorTransactionEntry
    | VendorCommissionEntry
    | VendorDepositEntry
    | VendorCreditNoteEntry
    | VendorCostOfSalesEntry
    | VendorDebitNoteEntry;

export interface VendorLedgerTabResponse<T> {
    entries: T[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export interface VendorLedgerTabFilters {
    page: number;
    itemsPerPage: number;
    from?: string;
    to?: string;
    searchText?: string;
    // Only the tabs with a Status filter read these, each its own choices.
    status?: string;
    mode?: string;
    // Only the subscriber Wallet reads this: the kind of movement.
    type?: string;
    // Only the statements and the subscriber Wallet read this: debit or credit lines.
    side?: string;
}

export interface VendorSlipPayload {
    slipBase64?: string;
    slipName?: string;
    slipFormat?: string;
}

export interface VendorDepositPayload extends VendorSlipPayload {
    amount: number;
    depositDate: string;
    reference: string;
    mode: string;
    note: string;
}

export interface VendorStatementEntry {
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

export interface VendorStatementResponse {
    vendorName: string;
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    entries: VendorStatementEntry[];
    recordsTotal: number;
    truncated: boolean;
    page: number;
    itemsPerPage: number;
}

export interface VendorOpeningBalancePayload extends VendorSlipPayload {
    amount: number;
    asOfDate: string;
    note: string;
}

export interface VendorEntryPayload extends VendorSlipPayload {
    amount: number;
    gstInclusive: boolean;
    issueDate: string;
    reason: string;
    againstCorporateTxnId: string;
}
