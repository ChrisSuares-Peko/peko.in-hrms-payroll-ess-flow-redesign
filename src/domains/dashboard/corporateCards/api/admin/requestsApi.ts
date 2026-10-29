import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/** Per-type payload captured on a request row (CARD_ISSUANCE vs LIMIT_INCREASE fields). */
export interface RequestPayload {
    cardType?: string;
    requestedLimit?: number;
    /** Cap the cardholder asked for on any single transaction, when they set one. */
    perTxnLimit?: number;
    requestedAmount?: number;
    currentLimit?: number;
    /** Delivery address for a physical CARD_ISSUANCE request. */
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
    /** UNFREEZE snapshot — why the card was frozen, captured when the request was raised. */
    freezeReasonLabel?: string | null;
    freezeReasonNote?: string | null;
    frozenByRole?: string | null;
    frozenAt?: string | null;
}

export interface RequestResult {
    approvedLimit?: number;
    appliedLimit?: number;
    issuedCardIssuanceId?: number;
    frozen?: boolean;
    unfrozen?: boolean;
    /** The card was already active when the request was approved, so no vendor call was needed. */
    alreadyActive?: boolean;
    /** Closed automatically because an admin unfroze the card directly. */
    viaDirectUnfreeze?: boolean;
}

/** A row from GET /requests (admin approval queue) — mirrors listRequests' serialiseRequestRow. */
export interface CardRequestItem {
    id: number;
    date: string;
    requestType: string;
    status: string;
    reason: string | null;
    decisionNote: string | null;
    decidedAt: string | null;
    cardIssuanceId: number | null;
    cardLast4: string | null;
    payload: RequestPayload;
    result: RequestResult;
    member: string | null;
    memberEmail?: string | null;
    holderId: number | null;
}

interface RequestsResponse {
    count: number;
    rows: CardRequestItem[];
}

export interface ListRequestsParams {
    requestType?: string;
    status?: string;
    cardType?: string;
    cardholder?: string;
    searchText?: string;
    cardIssuanceId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    itemsPerPage?: number;
}

/** Override + note for an approval. approvedLimit → CARD_ISSUANCE, appliedLimit → LIMIT_INCREASE. */
export interface ApproveRequestPayload {
    approvedLimit?: number;
    appliedLimit?: number;
    note?: string;
}

export const listRequests = async (
    userType: string,
    userId: number,
    params: ListRequestsParams
) => {
    try {
        const res: SuccessGenericResponse<RequestsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/requests`,
            {
                params: {
                    ...(params.requestType ? { requestType: params.requestType } : {}),
                    ...(params.status ? { status: params.status } : {}),
                    ...(params.cardType ? { cardType: params.cardType } : {}),
                    ...(params.cardholder ? { cardholder: params.cardholder } : {}),
                    ...(params.searchText ? { searchText: params.searchText } : {}),
                    ...(params.cardIssuanceId ? { cardIssuanceId: params.cardIssuanceId } : {}),
                    ...(params.dateFrom ? { dateFrom: params.dateFrom } : {}),
                    ...(params.dateTo ? { dateTo: params.dateTo } : {}),
                    page: params.page ?? 1,
                    itemsPerPage: params.itemsPerPage ?? 100,
                },
            }
        );
        return res;
    } catch {
        return false;
    }
};

export const approveRequest = async (
    userType: string,
    userId: number,
    id: number,
    payload: ApproveRequestPayload = {}
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/requests/${id}/approve`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

export const rejectRequest = async (
    userType: string,
    userId: number,
    id: number,
    note?: string
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/requests/${id}/reject`,
            note ? { note } : {}
        );
        return res;
    } catch {
        return false;
    }
};

export const terminateCard = async (
    userType: string,
    userId: number,
    cardIssuanceId: number,
    reason?: string
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/requests/terminate`,
            { cardIssuanceId, ...(reason ? { reason } : {}) }
        );
        return res;
    } catch {
        return false;
    }
};
