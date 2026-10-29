import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    EmailDomainPlansData,
    EmailDomainPlansPayload,
    getEmailDomainPlan,
    updateEmailDomainPlanStatusPayload,
    EmailDomainPlans,
    ProductApiResponse,
} from '../types/emailDomainPlan';

export const getEmailDomainPlans = async (payload: UserPayload & getEmailDomainPlan) => {
    try {
        const resp: SuccessGenericResponse<EmailDomainPlansData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions-plans`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createEmailDomainPlans = async ({
    userId,
    userType,
    ...payload
}: UserPayload & EmailDomainPlans) => {
    try {
        delete payload.id;

        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/purchase/software-subscriptions-plans`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateEmailDomainPlans = async ({
    userId,
    userType,
    ...payload
}: UserPayload & EmailDomainPlansPayload) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: any = await ApiClient.put(
            `${userType}/${userId}/purchase/software-subscriptions-plans/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateActiveStatusEmailDomainPlans = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateEmailDomainPlanStatusPayload) => {
    try {
        const { id, ...restPayload } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.patch(
            `${userType}/${userId}/purchase/software-subscriptions-plans/${id}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllProducts = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ProductApiResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions-plans/products?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (
    payload: UserPayload & { type: string; searchText: string; sort: string; sortField: string }
) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions-plans/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteEmailDomainPlanApi = async (
    payload: UserPayload & { planId: string | number }
) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/purchase/software-subscriptions-plans/${payload.planId}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};
