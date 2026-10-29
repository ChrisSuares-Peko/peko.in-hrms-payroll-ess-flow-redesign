import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { PasswordPolicyResponse, updatePasswordPolicy } from '../types/PasswordPolicy';

export const getPasswordPolicies = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<PasswordPolicyResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/password-policy`
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updatePasswordPolicies = async ({
    userType,
    userId,
    id,
    ...payload
}: UserPayload & updatePasswordPolicy) => {
    try {
        const resp: SuccessGenericResponse<PasswordPolicyResponse> = await ApiClient.put(
            `${userType}/${userId}/others/password-policy/${id}`,
            payload
        );

        return resp;
    } catch (err) {
        return { success: false, errorMessage: err.response.data.message };
    }
};
