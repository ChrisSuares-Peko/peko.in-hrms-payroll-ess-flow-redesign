import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ProcessSalaryEmployeesPayload,
    ProcessSalaryEmployeesResponse,
    ProcessSalaryPayload,
    ProcessSalaryResponse,
} from '../../types/processSalary';

export const getProcessSalaryEmployeesApi = async (
    payload: ProcessSalaryEmployeesPayload
) => {
    try {
        const res: SuccessGenericResponse<ProcessSalaryEmployeesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/process-salary/employees`,
            {
                params: {
                    month: Number(payload.month),
                    year: Number(payload.year),
                    page: payload.page,
                    limit: payload.limit,
                    searchText: payload.searchText,
                },
            }
        );

        return res.data;
    } catch (error) {
        return false;
    }
};

export const processSalaryApi = async (payload: ProcessSalaryPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const res: SuccessGenericResponse<ProcessSalaryResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/process-salary`,
            body
        );

        return res.data;
    } catch (error) {
        return false;
    }
};
