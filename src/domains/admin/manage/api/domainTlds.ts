import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { UserPayload } from '../types/vendorPayout';

export const getDomainTlds = async ({ userId, userType }: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<string[]> = await ApiClient.get(
            `${userType}/${userId}/others/domain-tlds`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateDomainTlds = async ({
    userId,
    userType,
    tlds,
}: UserPayload & { tlds: string[] }) => {
    try {
        const resp: SuccessGenericResponse<string[]> = await ApiClient.post(
            `${userType}/${userId}/others/domain-tlds`,
            { tlds }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
