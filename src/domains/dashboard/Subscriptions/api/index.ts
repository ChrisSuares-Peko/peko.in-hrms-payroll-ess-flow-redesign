import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    SubscriptionListResponse,
    OrderHistoryTablePayload,
    OrderHistoryListResponse,
    SubscriptionDetailsPayload,
    SubscriptionDetailsResponse,
    PlanDetailsResponse,
    PlanDetailsPayload,
    SelectedPlanDetailsResponse,
    PaymentRequestPayload,
    PaymentRequestResponse,
    SubscriptionPayload,
    CountriesResponse,
    UserDetailsPayload,
    userDetailsResponse,
    categoryPayload,
    categoryResponse,
} from '../types/types';

export const getSubscriptions = async (payload: SubscriptionPayload) => {
    try {
        const resp: SuccessGenericResponse<SubscriptionListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwares/subscriptions`,
            {
                params: {
                    searchText: payload.searchText,
                    start: payload.page,
                    page: payload.page,
                    length: payload.length,
                    draw: 1,
                    sort: payload.category,
                    catIds: payload.selectedCategory,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getOrderHistoryTable = async (payload: OrderHistoryTablePayload) => {
    try {
      
        const resp: SuccessGenericResponse<OrderHistoryListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwares/allSubscriptions?sort=DESC`,
            {
                params: {
                    searchText: payload.search,
                    page: payload.start,
                    itemsPerPage: payload.length,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const getSingleSubscriptionDetails = async (payload: SubscriptionDetailsPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/purchase/softwares/details?productId=${payload.subscriptionID}`;
        const resp: SuccessGenericResponse<SubscriptionDetailsResponse> =
            await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getPlanDetails = async (payload: SubscriptionDetailsPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/purchase/softwares/plans?productId=${payload.subscriptionID}`;
        const resp: SuccessGenericResponse<PlanDetailsResponse> = await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getSingleSelectedPlanDetails = async (payload: PlanDetailsPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/purchase/softwares/singlePlan?id=${payload.planId}`;

        const resp: SuccessGenericResponse<SelectedPlanDetailsResponse> =
            await ApiClient.get(endpoint);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const postPaymentRequest = async (payload: PaymentRequestPayload) => {
    try {
        const resp: SuccessGenericResponse<PaymentRequestResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/purchase/softwares/payment`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};
export const getCountries = async () => {
    try {
        const resp: SuccessGenericResponse<CountriesResponse> =
            await ApiClient.get(`user/general/countries`);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getUserDetails = async (payload: UserDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<userDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwares/corporateDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCategories = async (payload: categoryPayload) => {
    try {
        const resp: SuccessGenericResponse<categoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/softwares/fetchAllCategories`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
