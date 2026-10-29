import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    addDeductionPayload,
    getDeductionPayload,
    singleDeductionPayload,
    updateDeductionPayload,
} from '../../../types/salaryProfileTypes/deductionTypes';

export const addDeduction = async (payload: addDeductionPayload) => {
    const reqbody = {
        deductionFor: payload.deductionFor,
        note: payload.note,
        amount: payload.amount,
        month: payload.month,
        year: payload.year,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/deductions/${payload.employeeId}/direct`,
            reqbody
        );

        return resp;
    } catch (err) {
        return false;
    }
};

export const getDeduction = async (payload: getDeductionPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/deductions/${payload.eId}`,
            {
                params: {
                    page: payload.page,
                    limit: payload.limit,
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

export const updateDeduction = async (payload: updateDeductionPayload) => {
    const reqbody = {
        deductionFor: payload.deductionFor,
        note: payload.note,
        amount: payload.amount,
    };
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/deductions/${payload.employeeId}/${payload.id}`,
            reqbody
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteDeduction = async (payload: singleDeductionPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/deductions/${payload.eId}/${payload.deductionId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
