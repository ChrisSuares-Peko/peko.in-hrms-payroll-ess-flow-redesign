import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OrderHistoryListResponse, OrderHistoryTablePayload } from '../types/index';

export const getEmailDomainOrderHistoryTable = async ({
    userId,
    userType,
    ...payload
}: OrderHistoryTablePayload) => {
    try {
        const resp: SuccessGenericResponse<OrderHistoryListResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/software-subscriptions/transactions?sort=DESC`,
            {
                params: {
                    searchText: payload.search,
                    page: payload.start,
                    itemsPerPage: payload.length,
                    from: payload.from,
                    to: payload.to,
                    productId: payload?.productId,
                },
            }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
