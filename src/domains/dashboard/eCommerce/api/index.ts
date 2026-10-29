import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    cancelBillingPayload,
    CommonPayload,
    isPurchasedResponse,
    SubscriptionApiPayload,
    SubscriptionDetailsResponse,
} from '../types';

export const getIsServiceAccess = async (payload: CommonPayload) => {
    try {
        const resp: SuccessGenericResponse<isPurchasedResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/ecommerce/plan`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getEcommercePlans = async (payload: SubscriptionApiPayload) => {
    try {
        const res: SuccessGenericResponse<SubscriptionDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/ecommerce/all-plans?accessKey=${payload.accessKey}`
        );
        return res.data;
    } catch (err) {
        return false;
    }
};

export const cancelBilling = async (payload: cancelBillingPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/officeAndBusiness/ecommerce/cancel-subscription/${payload.subscriptionId}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};
