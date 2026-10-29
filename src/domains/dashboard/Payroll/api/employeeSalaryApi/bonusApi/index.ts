import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    bonusAmountCalculatePayload,
    bonusAmountResponse,
    bonusDeletePayload,
    bonusDeleteResponse,
    bonusListingResponse,
    bonusPayload,
    createBonusPayload,
    createBonusResponse,
    singleBonusPayload,
    singleBonusResponse,
    updateBonusPayload,
} from '../../../types/salaryProfileTypes/bonustypes';

export const bonusDetails = async (payload: bonusPayload) => {
    try {
        const res: SuccessGenericResponse<bonusListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/bonus/${payload.eId}`,
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
export const bonusAmountCalculate = async (payload: bonusAmountCalculatePayload) => {
    try {
        const res: SuccessGenericResponse<bonusAmountResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/bonus/calculation/${payload.eId}`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
export const createBonus = async (payload: createBonusPayload) => {
    try {
        const res: SuccessGenericResponse<createBonusResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/bonus/${payload.employeeId}`,
            payload
        );

        return res;
    } catch (error) {
        return false;
    }
};
export const getSingleBonus = async (payload: singleBonusPayload) => {
    try {
        const resp: SuccessGenericResponse<singleBonusResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/bonus/bonus-details/${payload.bonusId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const bonusUpdate = async (payload: updateBonusPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payroll/bonus/${payload.bId}`,
            payload
        );

        return resp;
    } catch (err) {
        return false;
    }
};
export const deleteBonus = async (payload: bonusDeletePayload) => {
    try {
        const res: SuccessGenericResponse<bonusDeleteResponse> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/payroll/bonus/${payload.rId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};
