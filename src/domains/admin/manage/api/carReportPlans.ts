import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { CarReportPlan, GetCarReportPlansParams } from '../types/carReportPlan';

const BASE = (userType: string, userId: string | number) =>
    `${userType}/${userId}/officeAndBusiness/car-report-plans`;

export const getCarReportPlans = async (payload: UserPayload & GetCarReportPlansParams) => {
    try {
        const resp: SuccessGenericResponse<{ plans: CarReportPlan[]; count: number }> =
            await ApiClient.get(BASE(payload.userType, payload.userId), {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    reportType: payload.reportType,
                },
            });
        return resp.data;
    } catch {
        return false;
    }
};

export const createCarReportPlan = async ({
    userId,
    userType,
    ...payload
}: UserPayload & CarReportPlan) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<CarReportPlan> = await ApiClient.post(
            BASE(userType, userId),
            payload
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateCarReportPlan = async ({
    userId,
    userType,
    ...payload
}: UserPayload & CarReportPlan) => {
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

export const updateCarReportPlanStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & { id: number | string; status: boolean }) => {
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
