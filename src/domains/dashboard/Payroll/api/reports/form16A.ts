import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { employeeResponse, userPayload } from '../../types/types';

// export const getEmployees = async (payload: any) => {
//   try {
//     const { userType, userId, employee, assessmentYear } = payload;
// console.log('API Payload:', payload);
//     const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
//      `${userType}/${userId}/payroll/reports/form16b?employee=${employee}&assessmentYear=${assessmentYear}`

//     );

//     return resp.data;
//   } catch (err) {
//     return false;
//   }
// };
export const getEmployeesPartA = async (payload: any) => {
    try {
        const { userType, userId, employee, assessmentYear } = payload;

        // Extract the string ID
        const employeeId = String(employee);

        const resp = await ApiClient.get(`${userType}/${userId}/payroll/reports/form16a`, {
            params: {
                employee: employeeId, // backend receives this
                assessmentYear: assessmentYear.toString(),
            },
        });
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const CreateForm16A = async (payload: {
    userId: number;
    userType: string;
    payloadData: any;
}) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/reports/form16a`,
            {
                ...payload.payloadData,
            }
        );

        const { data } = resp;
        console.log('Response from Form16 API:', data);

        return data;
    } catch (err) {
        return false;
    }
};

export const getPayrollEmployees = async (payload: userPayload) => {
    try {
        const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/employee/current-employees?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
