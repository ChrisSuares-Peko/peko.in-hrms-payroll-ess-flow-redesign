import { SuccessGenericResponse } from '@customtypes/api';
import { UserPayload } from '@src/domains/admin/accounts/types/SelfTransferTypes';
import { ApiClient } from '@src/services/config';

import {
    AllAlertsResponse,
    CommonPayload,
    TotalSpentResponse,
    ChartDataResponse,
    ChartApiPayload,
    SelectTagResponse,
    AllBannersResponse,
    UpdateTour,
    productTourResponse,
    BannerPosition,
    SubscriptionDetailsResponse,
} from '../types/index';

export const getTotalSpentCounts = async (payload: CommonPayload) => {
    try {
        const resp: SuccessGenericResponse<TotalSpentResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/total`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllAlerts = async (payload: CommonPayload) => {
    try {
        const resp: SuccessGenericResponse<AllAlertsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/alerts`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getChartData = async (payload: ChartApiPayload) => {
    try {
        const resp: SuccessGenericResponse<ChartDataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/chart`,
            {
                params: {
                    paymentMode: payload.paymentMode,
                    year: payload.year,
                    month: payload.month,
                    monthlyView: payload.monthlyView,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getSelectTagData = async () => {
    try {
        const resp: SuccessGenericResponse<SelectTagResponse> = await ApiClient.get(
            'user/general/dashboard/chartOptions'
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllBanners = async (payload: CommonPayload & BannerPosition) => {
    try {
        const resp: SuccessGenericResponse<AllBannersResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/dashboard/banners?position=${payload.position}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateProductTour = async (payload: UserPayload & UpdateTour) => {
    try {
        const res: SuccessGenericResponse<productTourResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/productTour`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const fetchPekoPlusDetails = async (): Promise<SubscriptionDetailsResponse | false> => {
    try {
        const res: SuccessGenericResponse<SubscriptionDetailsResponse> = await ApiClient.get(
            `/user/subscription/check-expired-subscription`
        );

        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const cancelSubscriptionPlanPatch = async (subscriptionId: number) => {
    try {
        const res: SuccessGenericResponse<{ message: string }> = await ApiClient.patch(
            `user/subscription/cancel-subscription-plan/${subscriptionId}/subscription`
        );

        return res;
    } catch (error) {
        return false;
    }
};
