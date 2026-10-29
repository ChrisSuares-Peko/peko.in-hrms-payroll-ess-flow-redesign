import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CommonPayload,
    isPurchasedResponse,
    PosDashboardResponse,
    SubscriptionApiPayload,
    SubscriptionDetailsResponse,
} from '../types';

export const getIsServiceAccess = async (payload: CommonPayload) => {
    try {
        const resp: SuccessGenericResponse<isPurchasedResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/pos/plan`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getPosPlans = async (payload: SubscriptionApiPayload) => {
    try {
        const res: SuccessGenericResponse<SubscriptionDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/pos/all-plans?accessKey=${payload.accessKey}`
        );
        return res.data;
    } catch (err) {
        return false;
    }
};

export const getPosDashboard = async (payload: CommonPayload) => {
    try {
        const resp: SuccessGenericResponse<PosDashboardResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/pos/dashboard`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
