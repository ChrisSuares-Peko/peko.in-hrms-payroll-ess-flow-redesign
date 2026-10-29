import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { ListingPayload, ListingResponse } from '../type/index';

export const listingApi = async (payload: ListingPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<ListingResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/works`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
