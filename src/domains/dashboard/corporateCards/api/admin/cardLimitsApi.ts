import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { MerchantCategory } from '../../utils/types';

export interface CardLimitCardItem {
    id: number;
    holderId?: number;
    last4: string;
    maskedCardNumber?: string;
    /**
     * The issuer's order reference (the `referenceNumber` column). Not unique — a physical card inherits it
     * from the virtual it replaces. The tracking endpoint returns the same value as `referenceNumber`.
     */
    dbUniqueNumber?: string | null;
    holder: string;
    nameOnCard?: string;
    department: string;
    type: string;
    status: string;
    cardState: string;
    terminationStatus?: 'REQUESTED' | 'COMPLETED' | null;
    /** Who placed the current freeze — 'ADMIN' | 'CARDHOLDER' | 'SYSTEM'; null when the card is active. */
    frozenByRole?: string | null;
    freezeReasonLabel?: string | null;
    freezeReasonNote?: string | null;
    cardLimit: number;
    perTxnLimit: number | null;
    limitFrequency: string;
    atmEnabled: boolean;
    restrictedCategories: (string | MerchantCategory)[];
    spent: number;
    remaining: number;
}

interface CardLimitCardsResponse {
    count: number;
    rows: CardLimitCardItem[];
}

export interface UpdateCardLimitsPayload {
    cardLimit: number;
    perTxnLimit: number;
    frequency: string;
}

export interface UpdateCardControlsPayload {
    restrictedCategories: string[];
    atmEnabled: boolean;
}

/** Combined limits + controls save (Manage card → single Save). */
export interface UpdateCardSettingsPayload {
    cardLimit: number;
    perTxnLimit?: number;
    frequency: string;
    restrictedCategories: string[];
    atmEnabled: boolean;
}

export const updateCardLimits = async (
    userType: string,
    userId: number,
    cardIssuanceId: string,
    payload: UpdateCardLimitsPayload
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.put(
            `${userType}/${userId}/corporate-cards/cards/${cardIssuanceId}/limits`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

export const updateCardSettings = async (
    userType: string,
    userId: number,
    cardIssuanceId: string,
    payload: UpdateCardSettingsPayload
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.put(
            `${userType}/${userId}/corporate-cards/cards/${cardIssuanceId}/settings`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

export interface AuditApiItem {
    id: string | number;
    title: string;
    description: string;
    timestamp: string;
    actor: string;
    category: string;
    action: string;
}

interface AuditApiResponse {
    count: number;
    rows: AuditApiItem[];
}

export const getCardAudit = async (userType: string, userId: number, cardIssuanceId: string) => {
    try {
        const res: SuccessGenericResponse<AuditApiResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards/${cardIssuanceId}/audit`
        );
        return res;
    } catch {
        return false;
    }
};

export const exportCardAudit = async (userType: string, userId: number, cardIssuanceId: string) => {
    try {
        const res: Blob = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards/${cardIssuanceId}/audit/export`,
            { responseType: 'blob' }
        );
        return res;
    } catch {
        return false;
    }
};

export const updateCardControls = async (
    userType: string,
    userId: number,
    cardIssuanceId: string,
    payload: UpdateCardControlsPayload
) => {
    try {
        const res: SuccessGenericResponse<unknown> = await ApiClient.put(
            `${userType}/${userId}/corporate-cards/cards/${cardIssuanceId}/controls`,
            payload
        );
        return res;
    } catch {
        return false;
    }
};

interface MerchantCategoriesResponse {
    categories: MerchantCategory[];
}

/** Canonical restricted-category list (name + real MCC codes) — the source of truth for the
 * checkbox lists in IssueCardDrawer / ManageCardModal, instead of a hardcoded client-side copy. */
export const getMerchantCategories = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<MerchantCategoriesResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards/categories`
        );
        return res;
    } catch {
        return false;
    }
};

/** Fetch every card in the org without pagination — used for dropdown population. */
export const getAllCards = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<CardLimitCardsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards`
        );
        return res;
    } catch {
        return false;
    }
};

export const getCardLimitCards = async (
    userType: string,
    userId: number,
    page: number,
    itemsPerPage: number,
    type?: string,
    search?: string,
    status?: string,
    cardholder?: string
) => {
    try {
        const res: SuccessGenericResponse<CardLimitCardsResponse> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards`,
            {
                params: {
                    page,
                    itemsPerPage,
                    ...(type ? { type } : {}),
                    ...(search ? { searchText: search } : {}),
                    ...(status ? { status } : {}),
                    ...(cardholder ? { userId: cardholder } : {}),
                },
            }
        );
        return res;
    } catch {
        return false;
    }
};
