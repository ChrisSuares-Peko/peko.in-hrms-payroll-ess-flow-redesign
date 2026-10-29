import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ImageUpload,
    ImageUploadResponse,
    PlanDetail,
    PlansListResponse,
    WorkSpaceListResponse,
    orderHistoryPayload,
    orderHistoryResponse,
} from '../types/index';

export const getAllPlans = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<PlansListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces/allPlans`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPlan = async (payload: UserPayload, id: number) => {
    try {
        const resp: SuccessGenericResponse<PlanDetail> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces/fetchSinglePlan/${id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllWorkspaces = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<WorkSpaceListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces/allWorkspaces`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const uploadFiles = async (
    payload: UserPayload,
    files: { fileUploadData: ImageUpload[] }
) => {
    const { userId, userType } = payload;
    try {
        const resp: SuccessGenericResponse<ImageUploadResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/workspaces/fileUpload`,
            files
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getTransactionsApi = async (payload: orderHistoryPayload) => {
    try {
        const res: SuccessGenericResponse<orderHistoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/workspaces/workspaceHistory`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.search,
                    from: payload.fromDate,
                    to: payload.toDate,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
