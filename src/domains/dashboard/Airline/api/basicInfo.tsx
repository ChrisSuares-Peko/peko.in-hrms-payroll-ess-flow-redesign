import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { employeePayload, employeeResponse } from '../../Payroll/types/docAndAssetsTypes';
import { BasicInfoResponse } from '../../profile/types';

export const getEmployees = async (payload: employeePayload) => {
    try {
        const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/employee/existing-employees?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getBasicInfo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<BasicInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/basic`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
