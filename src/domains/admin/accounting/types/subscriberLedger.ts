import { Posting } from './posting';
import { VendorLedgerTabFilters } from './vendorLedger';

export interface SubscriberSummary {
    topUps: number;
    withdrawals: number;
    spent: number;
    paidViaGateway: number;
    platformFee: number;
    cashback: number;
    walletBalance: number;
    ledgerBalance: number;
    walletDifference: number;
}

export interface SubscriberLedgerRow {
    id: number;
    credentialId: number;
    corporateUserId: number | null;
    name: string | null;
    contactPersonName: string | null;
    username: string | null;
    email: string | null;
    partnerName: string | null;
    planName: string | null;
    kycStatus: string | null;
    isActive: boolean;
    walletBalance: number;
}

export interface SubscriberLedgerKpis {
    totalSubscribers: number;
    walletBalancesHeld: number;
    subscribersWithBalance: number;
    gmvThisMonth: number;
    spentThisMonth: number;
    platformFeeThisMonth: number;
    cashbackThisMonth: number;
}

export interface SubscriberLedgerListResponse {
    subscribers: SubscriberLedgerRow[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
    kpis: SubscriberLedgerKpis;
    generatedAt: string;
    cached: boolean;
}

export interface SubscriberLedgerDetailResponse {
    subscriber: SubscriberLedgerRow;
    summary: SubscriberSummary;
}

export interface SubscriberTransactionEntry {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    service: string | null;
    orderAmount: number | null;
    discount: number | null;
    paidFromWallet: number | null;
    paidViaGateway: number | null;
    status: string | null;
    paymentMode: string | null;
    receiptAvailable: boolean;
    posting: Posting;
}

export type SubscriberOrderDocument = 'receipt' | 'fullInvoice' | 'pekoInvoice';

export type SubscriberBillKind = 'invoice' | 'platformFeeInvoice';

export interface SubscriberBillEntry {
    id: string;
    orderId: number;
    corporateTxnId: string;
    transactionDate: string;
    service: string | null;
    document: SubscriberOrderDocument;
    kind: SubscriberBillKind;
    label: string;
    documentNumber: string | null;
    issuedDate: string | null;
    taxable: number | null;
    gst: number | null;
    total: number | null;
}

export type SubscriberWalletMovementType =
    | 'Purchase'
    | 'Refund'
    | 'Cashback'
    | 'Cashback reversal'
    | 'Top-up'
    | 'Admin credit'
    | 'Admin withdrawal';

export interface SubscriberWalletEntry {
    id: string;
    transactionDate: string;
    reference: string | null;
    type: SubscriberWalletMovementType | null;
    particulars: string | null;
    remark: string | null;
    debit: number | null;
    credit: number | null;
    balanceAfter: number | null;
    posting: Posting;
}

export type SubscriberLedgerEntry =
    SubscriberTransactionEntry | SubscriberWalletEntry | SubscriberBillEntry;

export interface SubscriberLedgerTabResponse<T> {
    entries: T[];
    recordsTotal: number;
    page: number;
    itemsPerPage: number;
}

export type SubscriberLedgerTabFilters = VendorLedgerTabFilters;
