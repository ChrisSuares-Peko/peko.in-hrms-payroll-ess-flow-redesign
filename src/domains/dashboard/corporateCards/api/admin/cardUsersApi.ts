import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface CardUserItem {
    id: number;
    name: string;
    email: string;
    mobileNo: string;
    role: string;
    /**
     * The corporate account holder's own cardholder row, which the server pins first in this listing. It is
     * a structural fact (their cardholder row hangs off their own credential), NOT the role string — a real
     * member can be an Admin too, so gating on `role === 'Admin'` would lock every employee Admin out
     * of the same actions.
     */
    isAccountOwner?: boolean;
    isSelf?: boolean;
    status: string;
    hasSetPassword?: boolean;
    kycStatus: string;
    cardStatus: string;
    cardCount: number;
    joined: string;
}

interface CardUsersResponse {
    count: number;
    rows: CardUserItem[];
}

export const getCardUsers = async (
    userType: string,
    userId: number,
    params: { kycStatus?: string; page?: number; itemsPerPage?: number } = {}
) => {
    try {
        const res: SuccessGenericResponse<CardUsersResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cardholders`,
            {
                params: {
                    ...(params.kycStatus ? { kycStatus: params.kycStatus } : {}),
                    ...(params.page ? { page: params.page } : {}),
                    ...(params.itemsPerPage ? { itemsPerPage: params.itemsPerPage } : {}),
                },
            }
        );
        return res;
    } catch (error) {
        return false;
    }
};

interface FreezeCardholderCardsResponse {
    summary: { requested: number; succeeded: number; failed: number };
    results: { id: number; ok: boolean; message: string }[];
}

/**
 * Freeze all of a member's active corporate cards — called on member removal so a deleted member's cards
 * stop spending (member deletion itself is a separate platform-level soft-delete that doesn't touch the vendor).
 */
export const freezeCardholderCards = async (
    userType: string,
    userId: number,
    cardholderUserId: string
) => {
    try {
        const res: SuccessGenericResponse<FreezeCardholderCardsResponse> = await ApiClient.post(
            `${userType}/${userId}/corporate-cards/cardholders/${cardholderUserId}/freeze-cards`,
            {}
        );
        return res;
    } catch (error) {
        return false;
    }
};
