import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApiResponsePlan,
    PlanBody,
    PlanID,
    PlanWithoutID,
    getPlan,
    updatePlanStatusPayload,
} from '../types/plans';

export const getPlanData = async (payload: UserPayload & getPlan) => {
    try {
        const resp: SuccessGenericResponse<ApiResponsePlan> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/plans`,
            {
                params: {
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
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

export const getFileBufferReport = async (payload: UserPayload & getPlan) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/plans/${payload.type}`,
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

export const updatePlanStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updatePlanStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/plans/updateStatus/${payload.planId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdatePlan = async ({ userId, userType, ...payload }: UserPayload & PlanBody) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/officeAndBusiness/plans/${payload.id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createPlan = async ({ userId, userType, ...payload }: UserPayload & PlanWithoutID) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<PlanBody> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/plans`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deletePlan = async (payload: UserPayload & PlanID) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/plans/${payload.planId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
