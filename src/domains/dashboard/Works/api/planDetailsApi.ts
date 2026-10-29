import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { PlanDetailsPayload, WorkPlan } from '../type/index';

export const planDetailsApi = async (payload: PlanDetailsPayload) => {
    try {
        const { userId, userType, planId } = payload;
        const resp: SuccessGenericResponse<WorkPlan> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/works/plan/details/${planId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
