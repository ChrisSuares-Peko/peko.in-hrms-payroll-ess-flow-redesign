import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export const getEmployeeCtcApi = async (payload: UserPayload & { employeeId: string }) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/ctc-calculator/employee/${payload.employeeId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
