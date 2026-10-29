import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    getData,
    activeResponse,
    WorkPlanData,
    updateStatus,
    newWorkPlan,
    WorkPlanResponse,
    getAllWorksResponse,
} from '../types/workPlan';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<WorkPlanResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/work_plan`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
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

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/work_plan/${payload.type}`,
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

export const getUpdateStatus = async (payload: UserPayload & updateStatus) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/officeAndBusiness/work_plan/${payload.planId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteWorkPlan = async (payload: UserPayload & { id: number }) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/work_plan/${payload.id}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getAllWorksApi = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<getAllWorksResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/works/all?searchText=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createWorkPlan = async (payload: UserPayload & newWorkPlan) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<WorkPlanData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/work_plan`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateWorkPlan = async (payload: UserPayload & newWorkPlan) => {
    try {
        const resp: SuccessGenericResponse<WorkPlanData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/work_plan/${payload.id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};
