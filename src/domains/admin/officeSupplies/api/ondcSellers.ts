import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OndcSellersQuery, OndcSellersResponse } from '../types/ondcSeller';

const unwrapPage = (resp: any): OndcSellersResponse => {
    if (resp?.data && Array.isArray(resp.data.data)) return resp.data;
    if (Array.isArray(resp?.data)) return resp;
    return resp?.data ?? resp;
};

/** Admin Easy Split vendors registered for ONDC office supplies. */
export const getOndcEasySplitSellers = async (
    payload: UserPayload & OndcSellersQuery
): Promise<OndcSellersResponse | false> => {
    try {
        const resp: SuccessGenericResponse<OndcSellersResponse> | any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/sellers`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    _ts: Date.now(),
                },
            }
        );
        return unwrapPage(resp);
    } catch (err) {
        console.error('getOndcEasySplitSellers failed:', err);
        return false;
    }
};
