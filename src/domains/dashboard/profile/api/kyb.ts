import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { BasicInfoResponse } from '../types';

export const getKyb = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<BasicInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/one-kyb`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const addKyb = async (payload: any) => {
    const { userId, userType } = payload;
    delete payload.userId;
    delete payload.userType;
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/others/profile/one-kyb`,
            payload
        );
        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
