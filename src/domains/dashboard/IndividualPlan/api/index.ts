import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { SubscriptionDetailsResponse } from '../types/index';

export const getPurchaseDetailsApi = async (accessKey: string, serviceAccessKey?: string) => {
    try {
        const params = {
            accessKey,
            serviceAccessKey,
        };
        const res: SuccessGenericResponse<SubscriptionDetailsResponse> = await ApiClient.get(
            `/user/subscription/individual-details`,
            { params }
        );
        const { data } = res;
        return data;
    } catch (err) {
        return false;
    }
};
