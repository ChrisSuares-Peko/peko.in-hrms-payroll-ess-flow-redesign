import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';
import { VendorInfoData, transactionResponse } from '../types/vendors';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<transactionResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/reports/vendor-reports`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    vendorId: payload.id,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getVendors = async (payload: UserPayload & { searchText: string }) => {
    try {
        const resp: SuccessGenericResponse<VendorInfoData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/vendor/fetchAllVendors?searchText=${payload.searchText}`
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
            `${payload.userType}/${payload.userId}/others/reports/vendor-reports/${payload.type}`,
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
