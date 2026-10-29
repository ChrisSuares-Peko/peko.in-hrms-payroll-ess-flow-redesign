import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { BasicInfoResponse } from '../../profile/types';

export const getBasicInfo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<BasicInfoResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/basic`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
