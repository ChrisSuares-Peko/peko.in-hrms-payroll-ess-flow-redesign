import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    SoftwareListingResponse,
    SubscriptionAssignPayload,
    SubscriptionCreatePayload,
    SubscriptionCreateResponse,
    SubscriptionDeletePayload,
    SubscriptionInfoResponse,
    SubscriptionListingPayload,
    SubscriptionListingResponse,
    SubscriptionUpdatePayload,
    userPayload,
} from '../types/subscriptions/index';

export const listSubscription = async (payload: SubscriptionListingPayload) => {
    try {
        const res: SuccessGenericResponse<SubscriptionListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/subscriptions`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const listSoftwares = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<SoftwareListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/softwares/all`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const subscriptionInfo = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<SubscriptionInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/subscriptions/info`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createSubscription = async ({
    userType,
    userId,
    ...payload
}: SubscriptionCreatePayload) => {
    try {
        const res: SuccessGenericResponse<SubscriptionCreateResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/peko-cloud/subscriptions`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const updateSubscription = async (payload: SubscriptionUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/subscriptions/${payload.subscriptionId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteSubscription = async (payload: SubscriptionDeletePayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/subscriptions/${payload.subscriptionId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const assignSubscription = async ({
    userType,
    userId,
    ...payload
}: SubscriptionAssignPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/peko-cloud/subscriptions/assign`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};
