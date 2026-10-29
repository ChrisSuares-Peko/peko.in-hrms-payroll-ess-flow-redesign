import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    incentivePayload,
    incentiveListingResponse,
    createIncentivesPayload,
    createIncentivesResponse,
    updateIncentivesPayload,
    incentiveDeletePayload,
} from '../../../types/salaryProfileTypes/incentiveTypes';

export const incentiveDetails = async (payload: incentivePayload) => {
    try {
        const res: SuccessGenericResponse<incentiveListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/incentives/${payload.eId}`,
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

export const createIncentive = async (payload: createIncentivesPayload & UserPayload) => {
    try {
        const res: SuccessGenericResponse<createIncentivesResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/incentives/${payload.employeeId}`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const incentiveUpdate = async (payload: updateIncentivesPayload & UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/incentives/${payload.id}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteIncentive = async (payload: incentiveDeletePayload) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/incentives/${payload.rId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
