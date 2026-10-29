import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    getData,
    activeResponse,
    updateStatus,
    newCashback,
    ServiceData,
    ServiceResponse,
    ServiceProviderData,
    getPackagesApiResp,
    serviceOperatorsIds,
} from '../types/cashback';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<ServiceResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/cashback/transactions`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                    partnerId: payload.partnerId,
                    serviceOperatorId: payload.serviceOperatorId,
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
            `${payload.userType}/${payload.userId}/others/cashback/transactions/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    partnerId: payload.partnerId,
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
        const { cashbackId } = payload;
        delete payload.cashbackId;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${userType}/${userId}/others/cashback/updateStatus/${cashbackId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteDocument = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/cashback/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createCashbackApi = async ({
    userId,
    userType,
    ...payload
}: UserPayload & newCashback) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<ServiceData> = await ApiClient.post(
            `${userType}/${userId}/others/cashback`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateCashbackApi = async ({
    userId,
    userType,
    id,
    ...payload
}: UserPayload & newCashback) => {
    try {
        const resp: SuccessGenericResponse<ServiceData> = await ApiClient.put(
            `${userType}/${userId}/others/cashback/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getServiceOperatorsApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ServiceProviderData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/cashback/fetchServiceOperator?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPackagesApi = async (
    payload: UserPayload & {
        partnerId: string | undefined;
        excludeBasic?: boolean;
        excludeServicePackages?: boolean;
    }
) => {
    const { excludeBasic = false, excludeServicePackages = false } = payload;
    try {
        const resp: SuccessGenericResponse<getPackagesApiResp> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/cashback/packages?partnerId=${payload.partnerId}&excludeBasic=${excludeBasic}&excludeServicePackages=${excludeServicePackages}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getServicePackagesApi = async (
    payload: UserPayload & { partnerId: string | undefined; excludeBasic?: boolean }
) => {
    const { excludeBasic = false } = payload;
    try {
        const resp: SuccessGenericResponse<getPackagesApiResp> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/cashback/servicePackages?partnerId=${payload.partnerId}&excludeBasic=${excludeBasic}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const cashbackServiceProviderApi = async (payload: UserPayload & serviceOperatorsIds) => {
    try {
        const queryParams = new URLSearchParams({
            serviceOperators: payload.operatorIds.toString(),
            ...(payload.partnerId && { partnerId: payload.partnerId }),
            ...(payload.packageId && { packageId: payload.packageId }),
        });
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/cashback/checkCashbackServiceOperator?${queryParams}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
