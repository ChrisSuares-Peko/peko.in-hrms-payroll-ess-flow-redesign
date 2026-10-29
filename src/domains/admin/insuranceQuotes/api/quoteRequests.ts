import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    GetQuoteRequestsParams,
    QuoteRequestListResponse,
    UpdateQuoteStatusPayload,
} from '../types/quoteRequests';

const BASE = 'officeAndBusiness/insurance-quote-requests';

export const getAllQuoteRequests = async (
    payload: UserPayload & GetQuoteRequestsParams
): Promise<QuoteRequestListResponse | false> => {
    try {
        const resp: SuccessGenericResponse<QuoteRequestListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/${BASE}`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    status: payload.status,
                    insuranceType: payload.insuranceType,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateQuoteRequestStatus = async (
    payload: UserPayload & UpdateQuoteStatusPayload
) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/${BASE}/status/${payload.id}`,
            {
                status: payload.status,
                remarks: payload.remarks,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (
    payload: UserPayload & GetQuoteRequestsParams & { type: string }
): Promise<CommonFileBuffer | false> => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/${BASE}/export/${payload.type}`,
            {
                params: {
                    searchText: payload.searchText,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    status: payload.status,
                    insuranceType: payload.insuranceType,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
