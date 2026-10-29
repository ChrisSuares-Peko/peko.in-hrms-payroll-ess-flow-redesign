import { SuccessGenericResponse } from '@customtypes/general';
import { FRONTEND_BASE_URL } from '@src/config-global';
import { ApiClient } from '@src/services/config';

// Creates a payroll employee login (role USER, linked to the payroll employee
// via employeeId) and triggers the set-password / onboarding email.
export const createEmployeeUser = async (payload: {
    name: string;
    email: string;
    mobileNo?: string;
    employeeId?: string;
}) => {
    const res: SuccessGenericResponse<{ resent?: boolean }> = await ApiClient.post(
        `user/ess/user`,
        {
            ...payload,
            baseUrl: FRONTEND_BASE_URL,
        }
    );
    return res;
};

// Removes the payroll employee's ESS login/access (used e.g. on offboarding).
export const removeEmployeeUserAccess = async (employeeId: string | number) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.delete(
            `user/ess/user/${employeeId}`
        );
        return res;
    } catch (error) {
        return false;
    }
};

// Updates the login email for an already-invited ESS employee. Resends the
// set-password invite if they haven't set one yet, otherwise notifies them
// of the change without touching their password.
export const updateEssEmail = async (payload: { employeeId: string; email: string }) => {
    try {
        const res: SuccessGenericResponse<{}> = await ApiClient.put(
            `user/ess/user/${payload.employeeId}/email`,
            { email: payload.email, baseUrl: FRONTEND_BASE_URL }
        );
        return { success: true, data: res };
    } catch (err: any) {
        return { success: false, errorMessage: err.response?.data?.message };
    }
};
