import { ApiClient } from '@src/services/config';

export type LogisticsCorporateRecord = {
    credentialId: number;
    name: string;
    email: string;
    username: string;
    companyName: string | null;
    contactPersonName: string | null;
    businessPanUrl: string | null;
    panUploadedAt: string | null;
};

export type LogisticsCorporateResponse = {
    rows: LogisticsCorporateRecord[];
    count: number;
};

export type LogisticsListPayload = {
    userType: string;
    userId: string | number;
    page: number;
    itemsPerPage: number;
    searchText?: string;
};

export type AdminUploadPanPayload = {
    userType: string;
    userId: string | number;
    credentialId: number;
    base64String: string;
    imageFormat: string;
};

export const getLogisticsCorporateList = async (payload: LogisticsListPayload) => {
    try {
        const resp = await ApiClient.get(`${payload.userType}/${payload.userId}/travel/logistics`, {
            params: {
                page: payload.page,
                itemsPerPage: payload.itemsPerPage,
                searchText: payload.searchText,
            },
        });
        return resp.data as LogisticsCorporateResponse;
    } catch {
        return false;
    }
};

export const adminUploadBusinessPan = async (payload: AdminUploadPanPayload) => {
    try {
        const resp = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/logistics/${payload.credentialId}/upload-business-pan`,
            {
                base64String: payload.base64String,
                imageFormat: payload.imageFormat,
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};
