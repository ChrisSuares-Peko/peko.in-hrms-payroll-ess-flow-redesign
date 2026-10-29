import { SuccessGenericResponse } from '@customtypes/general';
import { UserPayload } from '@src/domains/admin/accounts/types/SelfTransferTypes';
import { ApiClient } from '@src/services/config';

import {
    FetchOrdersResponse,
    PackageQueryParams,
    ResponseDataSubscriptionHistory,
} from '../types/orderHistory';
import { orderPayload } from '../types/types';

export const fetchOrders = async (payload: orderPayload) => {
    try {
        const endpoint = `${payload.userType}/${payload.userId}/officeAndBusiness/whatsapp-business/orders-history?searchText=${payload.searchText}&page=${payload.page}&pageSize=${payload.pageSize}`;
        const response: SuccessGenericResponse<FetchOrdersResponse> = await ApiClient.get(endpoint);
        return response.data; // Assuming the API response has a 'data' field with order details and pagination info
    } catch (err) {
        console.error('Failed to fetch orders:', err);
        return false;
    }
};

export const getPurchaseHistory = async ({
    itemsPerPage,
    page,
    status,
    userType,
    userId,
    packageType,
    searchText,
}: PackageQueryParams & UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ResponseDataSubscriptionHistory> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/whatsapp-business/purchse-history`,
            {
                params: {
                    page,
                    itemsPerPage,
                    status,
                    packageType,
                    searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
