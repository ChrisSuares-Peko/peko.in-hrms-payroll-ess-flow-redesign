import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import { CommonPayload, MobileRechargeProvidersResponse } from '../types/index';

export const getMobileRechargeProviders = async (payload: CommonPayload) => {
    try {
        const res: SuccessGenericResponse<MobileRechargeProvidersResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/mobile-recharge-providers`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
