import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { PekoCreditsListPayload } from '../types/type';

export const getPekoCredits = async (payload: PekoCreditsListPayload) => {
    try {
        const response: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/subscription/all-coupon-codes`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.length,
                    accessKey: payload.accessKey,
                    packageId: payload.packageId,
                    billingType: payload.billingType,
                },
            }
        );
        const { data } = response;

        return data;
    } catch (err) {
        return null;
    }
};
