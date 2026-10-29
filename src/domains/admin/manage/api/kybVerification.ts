import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { KYBPayload, KYBResponse, UpdateKybPayload } from '../types/kybVerification';

export const getAllVerificationData = async (payload: UserPayload & KYBPayload) => {
    try {
        const resp: SuccessGenericResponse<KYBResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/kyb-verification/all`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateKybVerificationStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & UpdateKybPayload) => {
    try {
        const { id } = payload;

        delete payload.id;
        const resp: any = await ApiClient.patch(
            `${userType}/${userId}/others/kyb-verification/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};
