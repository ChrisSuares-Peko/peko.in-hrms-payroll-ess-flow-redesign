import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { GetStorageDataResponse, userPayload } from '../types/dash/index';

export const fetchStorageData = async (payload: userPayload) => {
    try {
        const res: SuccessGenericResponse<GetStorageDataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/peko-cloud/storage`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
