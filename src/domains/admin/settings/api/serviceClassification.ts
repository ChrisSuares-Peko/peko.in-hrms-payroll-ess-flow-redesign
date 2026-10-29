import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ClassificationOptionsResponse,
    ClassifyServiceResult,
    ClassifyServicesResult,
    ServiceClassification,
    ServiceClassificationFilters,
    ServiceClassificationListResponse,
    ServiceClassificationTab,
} from '../types/serviceClassification';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/services-type-config`;

export const getServiceClassification = async (
    payload: UserPayload & ServiceClassificationFilters
) => {
    try {
        const { userId, userType, searchText, sort, sortField, ...rest } = payload;
        const resp: SuccessGenericResponse<ServiceClassificationListResponse> = await ApiClient.get(
            `${base({ userId, userType })}/operators`,
            {
                params: {
                    ...rest,
                    searchText: searchText || undefined,
                    sort: sort || undefined,
                    sortField: sortField || undefined,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const classifyService = async (
    payload: UserPayload & { accessKey: string; planType: ServiceClassification }
) => {
    try {
        const { userId, userType, accessKey, planType } = payload;
        const resp: SuccessGenericResponse<ClassifyServiceResult> = await ApiClient.patch(
            `${base({ userId, userType })}/${encodeURIComponent(accessKey)}`,
            { planType }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getClassificationOptions = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ClassificationOptionsResponse> = await ApiClient.get(
            `${base(payload)}/options`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const classifyServices = async (
    payload: UserPayload & { accessKeys: string[]; planType: ServiceClassificationTab }
) => {
    try {
        const { userId, userType, accessKeys, planType } = payload;
        const resp: SuccessGenericResponse<ClassifyServicesResult> = await ApiClient.post(
            `${base({ userId, userType })}/classify`,
            { accessKeys, planType }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
