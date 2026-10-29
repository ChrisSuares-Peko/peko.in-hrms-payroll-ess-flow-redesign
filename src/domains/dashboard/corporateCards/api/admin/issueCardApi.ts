import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface IssueCardByAdminPayload {
    /** cardIssuance target: the `users.id` of the employee the card is assigned to. */
    userId: number;
    cardLimit: number;
    frequency: string;
    perTxnLimit?: number;
    restrictedCategories?: string[];
    atmEnabled?: boolean;
    /** Optional override for the printed name; defaults to the member's profile name server-side. */
    nameOnCard?: string;
}

export interface IssueCardResponse {
    /** false when the issuer has not confirmed the order yet — the card stays Pending until it does. */
    confirmed?: boolean;
    /** false when the card was issued but its spend controls could not be persisted (admin should set them). */
    controlsApplied?: boolean;
}

/** Admin directly issues a virtual card to one of their corporate's cardholders. */
export const issueCardByAdmin = async (
    userType: string,
    userId: number,
    payload: IssueCardByAdminPayload
) => {
    try {
        const res: SuccessGenericResponse<IssueCardResponse> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/cards/issue`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

/** Delivery details for an admin-issued physical companion card. */
export interface IssuePhysicalCardByAdminPayload {
    nameOnCard: string;
    fullName?: string;
    mobileNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
}

/**
 * Admin directly issues a PHYSICAL companion for an existing virtual card — no request/approval cycle
 * (that path is only for cardholder-raised requests). The physical card inherits the source card's limit.
 */
export const issuePhysicalCardByAdmin = async (
    userType: string,
    userId: number,
    cardIssuanceId: string,
    payload: IssuePhysicalCardByAdminPayload
) => {
    try {
        const res: SuccessGenericResponse<IssueCardResponse> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/cards/${cardIssuanceId}/physical`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

export interface PhysicalCardPreflight {
    ok: boolean;
    reason: string | null;
    message: string | null;
}

export const preflightPhysicalCardOrder = async (
    userType: string,
    userId: number,
    payload: { cardIssuanceId: string; cardRequestId?: number }
) => {
    try {
        const res: SuccessGenericResponse<PhysicalCardPreflight> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/cards/physical-preflight`,
            payload
        );
        return res?.data ?? null;
    } catch {
        return null;
    }
};
