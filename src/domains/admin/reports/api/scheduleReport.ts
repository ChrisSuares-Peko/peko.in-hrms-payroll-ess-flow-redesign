import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    updateSchedulerPayload,
    updateSchedulerResponse,
    SchedulerPayload,
    SchedulerResponse,
} from '../types/index';

export const getAllShedulerData = async (payload: SchedulerPayload) => {
    try {
        const res: SuccessGenericResponse<SchedulerResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/scheduler/reportSetting/getEmails`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateSheduler = async (payload: updateSchedulerPayload) => {
    try {
        const { userId, userType, route, ...restData } = payload;
        const res: SuccessGenericResponse<updateSchedulerResponse> = await ApiClient.patch(
            `${userType}/${userId}/scheduler/reportSetting/${route}`,
            restData
        );
        const { message } = res;
        return message;
    } catch (error) {
        return false;
    }
};
