import { KybStatus } from '../../manage/types/corporateCardApplications';

export type CardActivationStatus = 'Activated' | 'Pending' | 'Failed' | 'Terminated' | string;

export interface LookupCard {
    id: number;
    type: 'Virtual' | 'Physical' | string;
    last4: string | null;
    nameOnCard: string | null;
    status: string;
    issuanceStatus: string;
    activationStatus: CardActivationStatus;
    failureReason: string | null;
    cardState: 'ACTIVE' | 'FROZEN' | string;
    freezeReasonLabel: string | null;
    freezeReasonNote: string | null;
    frozenByRole: string | null;
    terminationStatus: 'REQUESTED' | 'COMPLETED' | null;
    cardLimit: number;
    perTxnLimit: number | null;
    limitFrequency: string;
    atmEnabled: boolean;
    deliveryStatus: 'Not dispatched' | 'In transit' | 'Delivered' | null;
    awbNumber: string | null;
    courierPartnerName: string | null;
    issuedOn: string;
}

export interface LookupKyc {
    status: 'INITIATED' | 'PENDING' | 'COMPLETED' | 'REJECTED' | string;
    reason: string | null;
    updatedAt: string | null;
}

export interface LookupMember {
    id: string;
    name: string | null;
    email: string | null;
    mobileNo: string | null;
    role: 'Admin' | 'Employee' | string;
    status: string | null;
    isAccountOwner: boolean;
    addedOn: string | null;
    kyc: LookupKyc | null;
    cards: LookupCard[];
}

export interface CorporateCardLookupDetail {
    profile: {
        corporateId: number;
        companyName: string | null;
        contactPersonName: string | null;
        accountId: string | null;
        email: string | null;
        phone: string | null;
        appliedOn: string;
    };
    kyb: {
        status: KybStatus;
        kybReference: string | null;
        rejectionReason: string | null;
        businessType: string | null;
        updatedAt: string;
    };
    wallet: {
        balance: number;
        totalCredited: number;
        totalSpent: number;
        totalCardLimits: number;
        svcCardNumberLast4: string | null;
    };
    stats: {
        admins: number;
        employees: number;
        cards: number;
        cardsByType: Record<string, number>;
        cardsByActivation: Record<string, number>;
        frozenCards: number;
        pendingCards: number;
        failedCards: number;
        kycByStatus: Record<string, number>;
        activityCount: number;
        requestCount: number;
        topUpCount: number;
        transactionCount: number;
    };
    members: LookupMember[];
    membersUnavailable: boolean;
    membersCapped: boolean;
    unassignedCards: LookupCard[];
}

export interface LookupActivityRow {
    id: string;
    action: string;
    category: string | null;
    title: string | null;
    description: string | null;
    isFailure: boolean;
    actor: string | null;
    cardholderName: string | null;
    cardIssuanceId: string | null;
    responseCode: number | string | null;
    createdAt: string;
}

export interface LookupRequestRow {
    id: string;
    requestType: string;
    cardType: string | null;
    status: string;
    reason: string | null;
    decisionNote: string | null;
    cardholderName: string | null;
    cardLast4: string | null;
    requestedAmount: number | null;
    decidedAt: string | null;
    createdAt: string;
}

export interface LookupTopUpRow {
    id: string;
    date: string;
    entryType: string;
    method: string;
    reference: string | null;
    description: string | null;
    status: string;
    amount: number;
}

export interface LookupDispatch {
    awbNumber: string | null;
    courierPartnerName: string | null;
    dispatchedAtUtc: string | null;
    origin: string | null;
    receivedAt: string | null;
}

export interface LookupDispatchRow {
    key: string;
    cardIssuanceId: number;
    orderedOn: string;
    holder: string | null;
    last4: string | null;
    nameOnCard: string | null;
    shippingAddress: string | null;
    status: string;
    dispatches: LookupDispatch[];
}

export interface PagedResult<T> {
    count: number;
    rows: T[];
}

export type LookupListKind = 'activity' | 'requests' | 'top-ups' | 'dispatches';
