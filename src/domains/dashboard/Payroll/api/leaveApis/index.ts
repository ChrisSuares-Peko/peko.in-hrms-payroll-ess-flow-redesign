import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    addLeavePayload,
    availableLeaveResponse,
    EmployeeLeaveListingPayload,
    exportLeaveDataPayload,
    exportLeaveDataResponse,
    GetTakenLeavePayload,
    GetTakenLeaveResponse,
    LeaveDeletePayload,
    leaveListingResponse,
    leaveListPayload,
    leavePayload,
    updateLeavePayload,
} from '../../types/leaveSection';

export const availableLeaves = async (payload: leavePayload) => {
    try {
        const resp: SuccessGenericResponse<availableLeaveResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/available-leaves/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const leaveList = async (payload: leaveListPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/all-leaves?`,
            {
                params: {
                    searchText: payload.search,
                    page: payload.start,
                    limit: 10,
                    year: payload.year,
                    month: payload.month,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const addLeave = async (payload: addLeavePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/leave-application/${payload.employeeId}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const leaveUpdate = async (payload: updateLeavePayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/leave-application/${payload.leaveId}`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};

export const deleteLeave = async (payload: LeaveDeletePayload) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/leave-application/${payload.rId}`
        );

        // const { data } = res;
        return res;
    } catch (error) {
        return false;
    }
};

export const getEmployeeTakenLeave = async (payload: GetTakenLeavePayload) => {
    try {
        const res: SuccessGenericResponse<GetTakenLeaveResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/leaves-taken/${payload.eId}`
        );
        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const employeeLeaveDetails = async (payload: EmployeeLeaveListingPayload) => {
    try {
        const res: SuccessGenericResponse<leaveListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/${payload.eId}`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
                    year: payload.year,
                    month: payload.month,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const ExportLeaveData = async (payload: exportLeaveDataPayload) => {
    try {
        const resp: SuccessGenericResponse<exportLeaveDataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/leave-application/leaves/export?month=${payload.month}&year=${payload.year}&searchText=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
