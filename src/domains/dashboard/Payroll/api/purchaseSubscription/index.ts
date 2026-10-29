import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ISubscriptionDetailsPayload,
    SubscriptionDetailsResponse,
} from '../../types/purchaseSubscription';

export const getPurchaseDetailsApi = async ({ accessKey }: ISubscriptionDetailsPayload) => {
    try {
        const params = {
            accessKey,
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
