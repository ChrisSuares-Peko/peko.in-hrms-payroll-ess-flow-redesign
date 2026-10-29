import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { UserPayload } from '../../accounts/types/SelfTransferTypes';
import { reminderPyload, Data, fetchData, days } from '../types/preReminders';

export const AddReminders = async (payload: UserPayload & reminderPyload) => {
    try {
        const { userId, userType, ...restpayload } = payload;
        const resp: SuccessGenericResponse<Data> = await ApiClient.post(
            `${userType}/${userId}/scheduler/preReminders`,
            restpayload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const fetchReminders = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<fetchData> = await ApiClient.get(
            `${userType}/${userId}/scheduler/preReminders`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const removeReminders = async (payload: UserPayload & days) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<fetchData> = await ApiClient.delete(
            `${userType}/${userId}/scheduler/preReminders?day=${payload.day}&scheduledTime=${payload.scheduledTime}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
