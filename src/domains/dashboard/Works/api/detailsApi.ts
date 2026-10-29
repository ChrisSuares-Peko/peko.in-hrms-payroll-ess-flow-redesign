import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DetailsPayload, Works } from '../type/index';

export const detailsApi = async (payload: DetailsPayload) => {
    try {
        const { userId, userType, workId } = payload;
        const resp: SuccessGenericResponse<Works> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/works/details/${workId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
