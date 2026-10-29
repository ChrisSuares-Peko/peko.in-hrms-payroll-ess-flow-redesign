import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    overtimePayload,
    overtimeListingResponse,
    createOvertimePayload,
    createOvertimeResponse,
    overtimeAmountCalculatePayload,
    overtimeAmountCalculateResponse,
    overtimeDeletePayload,
    overtimeDeletedResponse,
    updateOvertimePayload,
} from '../../../types/salaryProfileTypes/overtimeTypes';

export const overTimeDetails = async (payload: overtimePayload) => {
    try {
        const res: SuccessGenericResponse<overtimeListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/overtime/${payload.eId}`,
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
export const createOvertime = async (payload: createOvertimePayload & UserPayload) => {
    try {
        const res: SuccessGenericResponse<createOvertimeResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/overtime/${payload.employeeId}`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const calculateOvertime = async (payload: overtimeAmountCalculatePayload) => {
    try {
        const res: SuccessGenericResponse<overtimeAmountCalculateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/overtime/overtime-amount/${payload.eId}`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const overtimeUpdate = async (payload: updateOvertimePayload & UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/overtime//${payload.overtimeId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const deleteOvertime = async (payload: overtimeDeletePayload) => {
    try {
        const res: SuccessGenericResponse<overtimeDeletedResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/overtime/${payload.rId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
