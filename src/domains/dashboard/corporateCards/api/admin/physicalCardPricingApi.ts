import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

/** Server-priced extra physical card: `unitPrice` is the pre-GST base and GST is added on top. */
export interface PhysicalCardPricing {
    unitPrice: number;
    quantity: number;
    taxableAmount: number;
    taxAmount: number;
    taxRate: number;
    expectedPaymentAmount: number;
}

export const getPhysicalCardPricing = async (userType: string, userId: number, quantity = 1) => {
    try {
        const res: SuccessGenericResponse<PhysicalCardPricing> = await ApiClient.get(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/physical-card-pricing`,
            { params: { quantity } }
        );
        return res?.data ?? null;
    } catch {
        return null;
    }
};
