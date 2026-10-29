import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    DomainHostingPlan,
    DomainHostingPlansData,
    GetDomainHostingPlansParams,
    UpdateDomainHostingPlanStatusPayload,
} from '../types/domainHostingPlan';

const BASE = (userType: string, userId: string | number) =>
    `${userType}/${userId}/officeAndBusiness/domain-hosting-plans`;

export const getDomainHostingPlans = async (payload: UserPayload & GetDomainHostingPlansParams) => {
    try {
        const resp: SuccessGenericResponse<DomainHostingPlansData> = await ApiClient.get(
            BASE(payload.userType, payload.userId),
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                    planType: payload.planType,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createDomainHostingPlan = async ({
    userId,
    userType,
    ...payload
}: UserPayload & DomainHostingPlan) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<DomainHostingPlan> = await ApiClient.post(
            BASE(userType, userId),
            payload
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateDomainHostingPlan = async ({
    userId,
    userType,
    ...payload
}: UserPayload & DomainHostingPlan) => {
    try {
        const { id, ...rest } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${BASE(userType, userId)}/${id}`,
            rest
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateDomainHostingPlanStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & UpdateDomainHostingPlanStatusPayload) => {
    try {
        const { id, ...rest } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${BASE(userType, userId)}/status/${id}`,
            rest
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const deleteDomainHostingPlanApi = async (
    payload: UserPayload & { planId: string | number }
) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${BASE(payload.userType, payload.userId)}/${payload.planId}`
        );
        return resp;
    } catch {
        return false;
    }
};

export const refetchDomainHostingPricing = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${BASE(payload.userType, payload.userId)}/refetch-pricing`
        );
        return resp;
    } catch {
        return false;
    }
};

export const getDomainHostingPlansReport = async (
    payload: UserPayload & { type: string; searchText: string; sort: string; sortField: string }
) => {
    try {
        const url =
            payload.type === 'pdf'
                ? `${BASE(payload.userType, payload.userId)}/pdf`
                : `${BASE(payload.userType, payload.userId)}/${payload.type}`;
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(url, {
            params: {
                searchText: payload.searchText,
                sort: payload.sort,
                sortField: payload.sortField,
            },
        });
        return resp.data;
    } catch {
        return false;
    }
};

export const fetchVendorProductKeys = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${BASE(payload.userType, payload.userId)}/vendor-product-keys`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const fetchVendorPlansByKey = async (payload: UserPayload & { productKey: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${BASE(payload.userType, payload.userId)}/vendor-plans/${payload.productKey}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const bulkImportDomainHostingPlans = async (payload: UserPayload & { plans: any[] }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${BASE(payload.userType, payload.userId)}/bulk-import`,
            { plans: payload.plans }
        );
        return resp;
    } catch {
        return false;
    }
};
