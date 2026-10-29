import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { categoryResponse } from '../../users/types/corporateUserTypes';
import {
    CorporateUserData,
    Service,
    ServiceData,
    ServiceProviderData,
    activeResponse,
    createDisabledService,
    getData,
    search,
    updateStatus,
} from '../types/disabledTypes';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<ServiceData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/disableServices`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/disableServices/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getUpdateStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateStatus) => {
    try {
        const { serviceId } = payload;
        delete payload.serviceId;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${userType}/${userId}/others/disableServices/status/${serviceId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteDocument = async (payload: UserPayload & { id?: number }) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/disableServices/${id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const createDisabledApi = async ({
    userId,
    userType,
    ...payload
}: UserPayload & createDisabledService) => {
    try {
        const resp: SuccessGenericResponse<Service> = await ApiClient.post(
            `${userType}/${userId}/others/disableServices`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getSubPartner = async (payload: UserPayload & { partnerId: string }) => {
    try {
        const resp: SuccessGenericResponse<categoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/users/fetch-subpartner?partnerId=${payload.partnerId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getCorporates = async (
    payload: UserPayload & search & { partnerId?: string; subPartnerId?: string }
) => {
    try {
        const resp: SuccessGenericResponse<CorporateUserData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/disableServices/fetchAllCorporate?searchText=${payload.searchCorporate}&partnerId=${payload.partnerId}&subPartnerId=${payload.subPartnerId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getOperators = async (
    payload: UserPayload & search & { partnerId?: string; subPartnerId?: string }
) => {
    try {
        const resp: SuccessGenericResponse<ServiceProviderData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/disableServices/fetchServiceOperator?searchText=${payload.searchOperator}&partnerId=${payload.partnerId}&subPartnerId=${payload.subPartnerId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
