import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    SecurityInfoResponse,
    SecurityInfoUpdatePayload,
    SecurityInfoUpdateResponse,
} from '../types/security';

export const getSecurityInfo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<SecurityInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/security`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateSecurityInfo = async (payload: SecurityInfoUpdatePayload) => {
    try {
        const resp: SuccessGenericResponse<SecurityInfoUpdateResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/profile`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
