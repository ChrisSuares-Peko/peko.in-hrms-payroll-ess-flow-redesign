import { Posting } from './posting';

export type ManualJournalKey =
    | 'transaction'
    | 'refund'
    | 'adminRefund'
    | 'cashback'
    | 'cashbackReversal';

export type ManualJournalDirection = 'debit' | 'credit';

export interface ManualJournalLine {
    accountId: string;
    direction: ManualJournalDirection;
    amount: number;
    description?: string | null;
    accountName?: string | null;
}

export interface ManualJournalStamp {
    action: string;
    byId: number | null;
    byName: string | null;
    at: string;
    reason: string | null;
}

export interface ManualJournalStored {
    journalDate: string | null;
    notes: string | null;
    lineItems: ManualJournalLine[];
    providerJournalId: string | null;
    manual: ManualJournalStamp | null;
    reason: string | null;
    skipped: boolean;
}

export interface ManualJournalDefaults {
    journalDate: string;
    amount?: number | null;
    refundAmount?: number | null;
    totalOrderAmount?: number | null;
}

export interface ManualJournalEligibility {
    canRecord: boolean;
    reasons: string[];
}

export interface ManualJournalEvent {
    key: ManualJournalKey;
    label: string;
    verdict: boolean | null;
    posting: Posting;
    journal: ManualJournalStored | null;
    defaults: ManualJournalDefaults;
    eligibility: ManualJournalEligibility;
    warnings: string[];
}

export type ManualJournalAction = 'RECORDED';

export interface ManualJournalHistoryRow {
    id: number;
    corporateTxnId: string;
    journalKey: ManualJournalKey;
    event: string;
    action: ManualJournalAction;
    journalDate: string | null;
    reason: string;
    splitBefore: Record<string, unknown> | null;
    splitAfter: Record<string, unknown> | null;
    lineItemsBefore: ManualJournalLine[] | null;
    lineItemsAfter: ManualJournalLine[] | null;
    providerJournalId: string | null;
    result: 'POSTED' | 'FAILED';
    failureReason: string | null;
    recordedByName: string | null;
    createdAt: string;
}

export interface ManualJournalOrder {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    status: string | null;
    service: string | null;
    customer: {
        username: string | null;
        name: string | null;
        gstNumber: string | null;
        state: string | null;
    } | null;
    partnerId: number | null;
    partnerName: string | null;
    paymentGateway: string | null;
    amountInINR: number | null;
    paymentMode: string | null;
}

export type ManualJournalPaymentThrough = 'GATEWAY' | 'WALLET' | 'BOTH';
export type ManualJournalCommissionType = 'PERCENTAGE' | 'FLAT';
export type ManualJournalCommissionMode = 'MARGIN' | 'PRINCIPAL_MARKUP' | 'MIXED';
export type ManualJournalBillingType = 'MONTHLY' | 'ANNUALLY';
export type ManualJournalFeeType = 'FLAT' | 'PERCENTAGE';

// How the order was sold, as the accounts team states it before the figures are worked out.
export interface ManualJournalSetup {
    paymentThrough: ManualJournalPaymentThrough;
    orderAmount: number | null;
    pgAmount: number | null;
    gateway: { name: string | null; accountId: string | null };
    subscription: { is: boolean; billingType: ManualJournalBillingType | null };
    vendor: { present: boolean };
    commission: {
        present: boolean;
        type: ManualJournalCommissionType;
        mode: ManualJournalCommissionMode;
        value: number | null;
        fixed: number | null;
        inclusiveOfGst: boolean;
    };
    mixed: { principalAmount: number | null; marginAmount: number | null };
    platformFee: { type: ManualJournalFeeType; value: number | null };
    partner: {
        present: boolean;
        sharePercentage: number | null;
        gatewayCharge: { percentage: number | null; fixed: number | null } | null;
    };
    coupon: {
        used: boolean;
        totalDiscount: number | null;
    };
    gstRatePct: number;
}

export type ManualJournalSplitValue = number | string | boolean;

export interface ManualJournalSplitTemplate {
    split: Record<string, number>;
    enabledKeys: string[];
    facts: Record<string, ManualJournalSplitValue>;
    journalAccountIds: Record<string, unknown> | null;
}

export interface ManualJournalLookup {
    order: ManualJournalOrder;
    split: Record<string, unknown>;
    // Present only for an order whose breakdown was never worked out.
    setup: ManualJournalSetup | null;
    recordingPaused: boolean;
    beforeGoLive: boolean;
    accountingFloor: string;
    events: ManualJournalEvent[];
    history: ManualJournalHistoryRow[];
}

export interface ManualJournalAccount {
    id: string;
    name: string;
    type: string | null;
    shared: boolean;
}

export interface ManualJournalPreviewLine {
    accountId: string | null;
    accountName: string | null;
    direction: ManualJournalDirection;
    amount: number | null;
    description?: string | null;
}

export interface ManualJournalPreview {
    ok: boolean;
    suggested?: boolean;
    split?: Record<string, number | null>;
    lineItems: ManualJournalPreviewLine[];
    journalAccountIds: Record<string, unknown> | null;
    balanced: boolean;
    reason: string | null;
}

export interface ManualJournalPreviewPayload {
    journalData?: Record<string, ManualJournalSplitValue>;
    amount?: number;
    refundAmount?: number;
    totalOrderAmount?: number;
}

export interface ManualJournalEntryPayload {
    journalDate: string;
    lineItems: ManualJournalLine[];
    journalData?: Record<string, ManualJournalSplitValue>;
    journalAccountIds?: Record<string, unknown> | null;
    reason: string;
}

export interface ManualJournalResult {
    success: boolean;
    action?: 'recorded';
    providerJournalId?: string | null;
    reason: string | null;
    pending?: boolean;
    alreadyRecorded?: boolean;
    paused?: boolean;
    history?: ManualJournalHistoryRow | null;
}
