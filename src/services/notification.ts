import {
    SuccessGenericResponse,
    UserPayload,
    notificationListResponse,
} from '@customtypes/general';

import { ApiClient } from './config';

export const getNotifications = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<notificationListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/notification`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const resetNotifications = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<notificationListResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/notification`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
