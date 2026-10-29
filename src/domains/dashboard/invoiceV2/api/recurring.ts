import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateRecurringSchedulePayload,
    FetchRecurringListPayload,
    RecurringListStats,
    RecurringScheduleApiData,
    RecurringScheduleStatus,
} from '../types/recurring';

export const fetchRecurringList = async (payload: FetchRecurringListPayload) => {
    try {
        const { userId, userType, ...params } = payload;
        const resp: SuccessGenericResponse<{
            rows: RecurringScheduleApiData[];
            recordsTotal: number;
            stats: RecurringListStats;
        }> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/recurring`,
            { params }
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const fetchRecurringScheduleById = async (
    payload: UserPayload & { recurringId: string }
) => {
    try {
        const { userId, userType, recurringId } = payload;
        const resp: SuccessGenericResponse<RecurringScheduleApiData> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/recurring/${recurringId}`
        );
        return resp.status ? resp.data : false;
    } catch {
        return false;
    }
};

export const updateRecurringStatus = async (
    payload: UserPayload & { recurringId: string; status: RecurringScheduleStatus }
) => {
    try {
        const { userId, userType, recurringId, status } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.patch(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/recurring/${recurringId}/status`,
            { status }
        );
        return resp;
    } catch {
        return false;
    }
};

export const createRecurringSchedule = async (payload: CreateRecurringSchedulePayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<RecurringScheduleApiData> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/recurring`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};
