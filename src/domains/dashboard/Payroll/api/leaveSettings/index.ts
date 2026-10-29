import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreateLeaveComponentPayload,
    createLeaveComponentResponse,
    GetLeaveComponent,
    LeaveComponentListResponse,
    UpdateLeaveComponentPayload,
} from '../../types/organizationSettings';

export const getLeaveComponent = async (payload: GetLeaveComponent & UserPayload) => {
    try {
        const res: SuccessGenericResponse<LeaveComponentListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-component`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const createLeaveComponent = async (payload: CreateLeaveComponentPayload & UserPayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const res: SuccessGenericResponse<createLeaveComponentResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/leave-component`,
            restPayload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateLeaveComponent = async (payload: UpdateLeaveComponentPayload & UserPayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${userType}/${userId}/payroll/leave-component/${payload.id}/${payload.employeeId}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteLeaveComponent = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType } = payload;
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/payroll/leave-component/${payload.id}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
