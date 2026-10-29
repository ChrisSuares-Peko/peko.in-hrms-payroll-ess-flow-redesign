import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
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

export const updatePlanStatus = async (payload: UserPayload & updatePlanStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/plans/updateStatus/${payload.planId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const putUpdatePlan = async (payload: UserPayload & PlanBody) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/officeAndBusiness/plans/${payload.id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createPlan = async (payload: UserPayload & PlanWithoutID) => {
    try {
        const resp: SuccessGenericResponse<PlanBody> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/plans`,
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
