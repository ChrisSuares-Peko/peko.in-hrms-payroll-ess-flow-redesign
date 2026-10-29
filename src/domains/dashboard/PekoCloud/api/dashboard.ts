import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    DashboardListingResponse,
    // TaskToDoListingResponse,
    userPayload,
} from '../types/dash/index';

export const fetchDashboardData = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<DashboardListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/dashboard`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const fetchTaskToDo = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/task-to-do`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
