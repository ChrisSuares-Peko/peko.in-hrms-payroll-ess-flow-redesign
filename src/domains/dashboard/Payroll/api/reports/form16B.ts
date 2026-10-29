import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export const CreateForm16B = async (payload: {
    userId: number;
    userType: string;
    payloadData: any;
}) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payroll/reports/form16b`,
            {
                ...payload.payloadData,
            }
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const getEmployeesPartB = async (payload: any) => {
    try {
        const { userType, userId, employee, assessmentYear } = payload;

        // Extract the string ID
        const employeeId = String(employee);

        const resp = await ApiClient.get(`${userType}/${userId}/payroll/reports/form16b`, {
            params: {
                employee: employeeId, // backend receives this
                assessmentYear: assessmentYear.toString(),
            },
        });
        console.log('***', resp.data);
        return resp.data;
    } catch (err) {
        return false;
    }
};
// export const getPayrollEmployees = async (payload: userPayload) => {
//     try {
//         const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
//             `${payload.userType}/${payload.userId}/payroll/employee/current-employees?searchText=`
//         );
//         const { data } = resp;
//         return data;
//     } catch (err) {
//         return false;
//     }
// };
