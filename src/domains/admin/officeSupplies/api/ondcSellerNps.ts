import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    OndcSellerNpsQuery,
    OndcSellerNpsResponse,
    SellerNpProductAction,
    SellerNpToggleResult,
} from '../types/ondcSellerNp';

const unwrapPage = (resp: any): OndcSellerNpsResponse => {
    if (resp?.data && Array.isArray(resp.data.data)) return resp.data;
    if (Array.isArray(resp?.data)) return resp;
    return resp?.data ?? resp;
};

/** Admin seller NPs recorded from on_search (Manage > Products > Seller NPs). */
export const getOndcSellerNps = async (
    payload: UserPayload & OndcSellerNpsQuery
): Promise<OndcSellerNpsResponse | false> => {
    try {
        const resp: SuccessGenericResponse<OndcSellerNpsResponse> | any = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/seller-nps`,
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
        console.error('getOndcSellerNps failed:', err);
        return false;
    }
};

export const setOndcSellerNpEnabledApi = async (
    payload: UserPayload & {
        id: number;
        enabled: boolean;
        productAction?: SellerNpProductAction;
    }
): Promise<SellerNpToggleResult | false> => {
    try {
        const resp: any = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/purchase/ecommerce/ondc/seller-nps/${payload.id}/enabled`,
            { enabled: payload.enabled, productAction: payload.productAction }
        );
        return resp?.data ?? resp;
    } catch (err) {
        console.error('setOndcSellerNpEnabledApi failed:', err);
        return false;
    }
};
