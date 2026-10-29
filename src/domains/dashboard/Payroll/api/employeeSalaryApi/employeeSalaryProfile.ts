import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    gratuityCalculatePayload,
    gratuityCalculateResponse,
} from '../../types/salaryProfileTypes/employeeSalaryProfile';

export const gratuityCalculate = async (payload: gratuityCalculatePayload) => {
    try {
        const res: SuccessGenericResponse<gratuityCalculateResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/gratuity`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
