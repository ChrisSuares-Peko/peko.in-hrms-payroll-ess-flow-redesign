import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { UserData, updatePassword, updateProfile } from '../types/index';

export const getAllData = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<UserData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/profileDetails/${payload.userId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const UpdateSystemUser = async (payload: UserPayload & updateProfile) => {
    try {
        // const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<UserData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/profile/${payload.userId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const UpdateSystemUserPassword = async (payload: UserPayload & updatePassword) => {
    try {
        const resp: SuccessGenericResponse<UserData> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/profile/password/change`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
