import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    IncrementDeleteResponse,
    createIncrementPayload,
    createIncrementResponse,
    incrementAmountCalculatePayload,
    incrementAmountResponse,
    incrementBasicSalaryType,
    incrementDeletePayload,
    incrementListingPayload,
    incrementListingResponse,
    updateIncrementPayload,
} from '../../../types/salaryProfileTypes/incrementTypes';

export const incrementAmountCalculate = async (payload: incrementAmountCalculatePayload) => {
    try {
        const res: SuccessGenericResponse<incrementAmountResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/increment/calculate-increment/${payload.eId}`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const incrementDetails = async (payload: incrementListingPayload) => {
    try {
        const res: SuccessGenericResponse<incrementListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/increment/${payload.eId}`,
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
export const createIncrement = async (payload: createIncrementPayload) => {
    try {
        const res: SuccessGenericResponse<createIncrementResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/increment/${payload.employeeId}`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const deleteIncrement = async (payload: incrementDeletePayload) => {
    try {
        const res: SuccessGenericResponse<IncrementDeleteResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/increment/${payload.rId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};

export const incrementUpdate = async (payload: updateIncrementPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/increment/${payload.incrementId}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const incrementBasicSalary = async (payload: incrementBasicSalaryType) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/increment/calculate-basic-salary/${payload.employeeId}?year=${payload.year}&month=${payload.month}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};
