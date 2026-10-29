import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { MerchantCategory } from '../../utils/types';

export interface CardApiItem {
    id: number;
    status: string;
    cardState: string;
    terminationStatus?: 'REQUESTED' | 'COMPLETED' | null;
    terminationRequested?: boolean;
    /** Form factor: 'Virtual' | 'Physical'. */
    type: string;
    maskedCardNumber: string;
    cardViewLink: string;
    nameOnCard?: string;
    orderId: number;
    /**
     * The issuer's order reference (the `referenceNumber` column). Not unique — a physical card inherits it
     * from the virtual it replaces. The tracking endpoint returns the same value as `referenceNumber`.
     */
    dbUniqueNumber?: string | null;
    externalRequestId: string;
    externalCardIdentifier: string;
    cardholder: {
        id: number;
        name: string;
        email: string;
        mobileNo: string;
    };
    requestedLimit: number | null;
    upiStatus: string;
    walletNumber: string | null;
    createdAt: string;
    cardLimit: number;
    perTxnLimit: number | null;
    limitFrequency: string;
    atmEnabled: boolean;
    restrictedCategories: (string | MerchantCategory)[];
    spent: number;
    remaining: number;
    /** Who placed the current freeze — 'ADMIN' | 'CARDHOLDER' | 'SYSTEM'; null when the card is active. */
    frozenByRole?: string | null;
    /** Status of the cardholder's open unfreeze request, if any. */
    unfreezeRequestStatus?: 'PENDING' | 'PROCESSING' | null;
    freezeReason?: number | null;
    freezeReasonLabel?: string | null;
    freezeReasonNote?: string | null;
}

interface CardsResponse {
    count: number;
    rows: CardApiItem[];
}

export interface CardStatusRequest {
    cardId: string;
    status: string;
    reason?: number;
    reasonNote?: string;
}

export interface IssueCardRequest {
    cardType: string;
    cardLimit: number;
    /** Optional cap on any single transaction; omitted means no per-transaction cap. */
    perTxnLimit?: number;
    reason?: string;
}

/** A cardholder's ask for an ADMIN/SYSTEM freeze to be lifted; the admin approves and the card is unfrozen. */
export interface UnfreezeRequest {
    /** cardIssuance DB id of the frozen card (MyCard.key). */
    cardIssuanceId: string;
    reason?: string;
}

export interface LimitIncreaseRequest {
    /** cardIssuance DB id of the card the increase applies to (MyCard.key). */
    cardIssuanceId: string;
    /** Additional amount requested on top of the current card limit. */
    amount: number;
    reason?: string;
}

/** A physical companion request for an existing virtual card (inherits its limit); ships to an address. */
export interface PhysicalCardRequest {
    /** cardIssuance DB id of the source virtual card (MyCard.key). */
    cardIssuanceId: string;
    nameOnCard: string;
    fullName: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    reason?: string;
}

/** A row from GET /requests/mine (the cardholder's own requests) — serialiseRequestRow shape. */
export interface MyRequestItem {
    id: number;
    date: string;
    requestType: string;
    status: string;
    reason: string | null;
    decisionNote: string | null;
    decidedAt: string | null;
    cardIssuanceId: number | null;
    cardLast4: string | null;
    payload: {
        cardType?: string;
        requestedLimit?: number;
        requestedAmount?: number;
        currentLimit?: number;
        shipping?: {
            nameOnCard?: string;
            addressLine1?: string;
            addressLine2?: string | null;
            fullName?: string | null;
            city?: string | null;
            state?: string | null;
            pinCode?: string | null;
            mobileNumber?: string | null;
        };
        freezeReasonLabel?: string | null;
        freezeReasonNote?: string | null;
        frozenByRole?: string | null;
        frozenAt?: string | null;
    };
    result: {
        appliedLimit?: number;
        approvedLimit?: number;
        unfrozen?: boolean;
        alreadyActive?: boolean;
        viaDirectUnfreeze?: boolean;
    };
}

interface MyRequestsResponse {
    count: number;
    rows: MyRequestItem[];
}

export const getUserCards = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<CardsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards`
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const issueCard = async (userType: string, userId: number, payload: IssueCardRequest) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/requests`,
            { requestType: 'CARD_ISSUANCE', ...payload }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const requestLimitIncrease = async (
    userType: string,
    userId: number,
    payload: LimitIncreaseRequest
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/requests`,
            {
                requestType: 'LIMIT_INCREASE',
                cardIssuanceId: payload.cardIssuanceId,
                amount: payload.amount,
                ...(payload.reason ? { reason: payload.reason } : {}),
            }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const requestUnfreeze = async (
    userType: string,
    userId: number,
    payload: UnfreezeRequest
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/requests`,
            {
                requestType: 'UNFREEZE',
                cardIssuanceId: payload.cardIssuanceId,
                ...(payload.reason ? { reason: payload.reason } : {}),
            }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const requestPhysicalCard = async (
    userType: string,
    userId: number,
    payload: PhysicalCardRequest
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/requests`,
            {
                requestType: 'CARD_ISSUANCE',
                cardType: 'Physical',
                cardIssuanceId: payload.cardIssuanceId,
                nameOnCard: payload.nameOnCard,
                fullName: payload.fullName,
                mobileNumber: payload.mobileNumber,
                addressLine1: payload.addressLine1,
                ...(payload.addressLine2 ? { addressLine2: payload.addressLine2 } : {}),
                city: payload.city,
                state: payload.state,
                pinCode: payload.pinCode,
                ...(payload.reason ? { reason: payload.reason } : {}),
            }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const listMyRequests = async (
    userType: string,
    userId: number,
    requestType?: string,
    cardType?: string
) => {
    try {
        const res: SuccessGenericResponse<MyRequestsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/requests/mine`,
            {
                params: {
                    ...(requestType ? { requestType } : {}),
                    ...(cardType ? { cardType } : {}),
                    page: 1,
                    itemsPerPage: 100,
                },
            }
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const updateCardStatus = async (
    userType: string,
    userId: number,
    data: CardStatusRequest
) => {
    try {
        const action = ['FROZEN', 'BLOCKED', 'Frozen', 'freeze'].includes(data.status)
            ? 'freeze'
            : 'unfreeze';
        const body =
            action === 'freeze' && data.reason
                ? {
                      reason: data.reason,
                      ...(data.reasonNote ? { reasonNote: data.reasonNote } : {}),
                  }
                : {};
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/cards/${data.cardId}/${action}`,
            body
        );
        return res;
    } catch (error) {
        return false;
    }
};
