import { AccountScope } from '../utils/accountScope';

export const THIRD_PARTY_SALE_KINDS = { paymentLinks: 'payment-links' } as const;

export type ThirdPartySaleKind =
    (typeof THIRD_PARTY_SALE_KINDS)[keyof typeof THIRD_PARTY_SALE_KINDS];

export type PaymentLinkOutcome = 'paid' | 'pending' | 'failed' | 'expired';

export type PaymentLinkSettlement = 'settled' | 'processing' | null;

export interface PaymentLinkEntry {
    id: number;
    linkId: string | null;
    reference: string | null;
    corporateName: string | null;
    corporateUsername: string | null;
    customerName: string | null;
    customerPhone: string | null;
    purpose: string | null;
    kind: 'payment_link' | 'invoice';
    raisedBy: 'corporate' | 'admin';
    provider: string;
    amount: number | null;
    outcome: PaymentLinkOutcome;
    settlement: PaymentLinkSettlement;
    createdAt: string | null;
    eventDate: string | null;
    paidAt: string | null;
    settledAt: string | null;
    utr: string | null;
    settlementUtr: string | null;
    expiresAt: string | null;
    linkUrl: string | null;
}

export interface PaymentLinksTotals {
    links: number;
    collected: number;
    pending: number;
    failed: number;
    expired: number;
}

export interface ThirdPartySalesResponse {
    entries: PaymentLinkEntry[];
    recordsTotal: number;
    totals: PaymentLinksTotals;
    page: number;
    itemsPerPage: number;
    kind: ThirdPartySaleKind;
}

export interface ThirdPartySalesFilters {
    kind: ThirdPartySaleKind;
    page: number;
    itemsPerPage: number;
    searchText: string;
    from: string;
    to: string;
    status?: PaymentLinkOutcome;
    accounts?: AccountScope;
    sort?: 'ASC' | 'DESC';
    sortField?: string;
}
