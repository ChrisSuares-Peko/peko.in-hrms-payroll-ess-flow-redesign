import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DetailsPayload, PlansResponse } from '../type/index';

export const plansApi = async (payload: DetailsPayload) => {
    try {
        const { userId, userType, workId } = payload;
        const resp: SuccessGenericResponse<PlansResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/works/plans/${workId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
