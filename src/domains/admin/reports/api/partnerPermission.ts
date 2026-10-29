import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { categoryResponse, categorySearch } from '../types/partnerPermission';

export const getpartner = async (payload: UserPayload & categorySearch) => {
    try {
        const resp: SuccessGenericResponse<categoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/users/fetch-partner?q=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
