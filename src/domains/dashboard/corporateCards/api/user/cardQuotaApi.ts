import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface CardQuota {
    used: number;
    included: number;
    purchased: number;
    allowed: number;
    remaining: number;
    requiresPayment: boolean;
    unitPrice: number;
    purchasable: boolean;
}

export const getCardQuota = async (userType: string, userId: number) => {
    try {
        const res: SuccessGenericResponse<CardQuota> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/cards/quota`
        );
        return res;
    } catch {
        return false;
    }
};
