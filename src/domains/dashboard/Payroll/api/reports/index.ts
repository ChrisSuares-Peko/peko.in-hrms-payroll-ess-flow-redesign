import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    IncomeDeclarationFormGetResponse,
    IncomeDeclarationFormPayload,
    IncomeDeclarationFormPostResponse,
} from '../../types/reports';

export const incomeDeclarationForm = async (
    payload: IncomeDeclarationFormPayload & { userId: number; userType: string }
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<IncomeDeclarationFormPostResponse> =
            await ApiClient.post(
                `${userType}/${userId}/payroll/reports/incomeDeclaration-form`,
                restPayload
            );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getIncomeDeclarationForm = async (
    payload: UserPayload & { employee: string; financialYear: number }
) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<IncomeDeclarationFormGetResponse> = await ApiClient.get(
            `${userType}/${userId}/payroll/reports/incomeDeclaration-form?employee=${payload.employee}&financialYear=${payload.financialYear}`
        );

        return resp;
    } catch (err) {
        console.error(err, 'error');
        return false;
    }
};
