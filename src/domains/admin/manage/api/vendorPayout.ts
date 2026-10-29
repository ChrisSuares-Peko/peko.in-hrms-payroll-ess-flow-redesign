import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CorporateRecordsResponse,
    GetAllKybDetailsPayload,
    StatusPayload,
    vendorPayload,
} from '../types/vendorPayout';

export const getAllKybDetails = async (payload: UserPayload & GetAllKybDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<CorporateRecordsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/vendorPayout/kybDetails/find-all`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const updateStatus = async (payload: UserPayload & StatusPayload) => {
    let reqbody;
    if (payload.status === 'RE UPLOAD') {
        reqbody = { status: payload.status, remarks: payload.remarks };
    } else if (payload.status === 'COMPLETED') {
        reqbody = { status: payload.status };
    }
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/payment/vendorPayout/kybDetails/update-status/${payload.kybId}`,
            reqbody
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: UserPayload & vendorPayload) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment/vendorPayout/kybDetails/${payload.type}`,
            {
                params: {
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
