import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';
import { TransactionInfoResp, UpdateStatusPayload } from '../types/workspace';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<TransactionInfoResp> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/reports/workspace-orders`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    sortField: payload.sortField,
                    partnerId: payload.partnerId,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/reports/workspace-orders/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    vendorId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateWorkSpaceStatus = async (payload: UserPayload & UpdateStatusPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/reports/workspace-orders/updateStatus/${payload.id}`,
            {
                workspaceOrderStatus: payload.workspaceOrderStatus,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
