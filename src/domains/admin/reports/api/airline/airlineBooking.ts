import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DownloadTicketPayload, getData } from '../../types';
import { airlineDataResponse } from '../../types/airline';

export const getAllBookingData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<airlineDataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/list-all-booking`,
            {
                params: {
                    page: payload.page,
                    limit: payload.itemsPerPage,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                    credentialId: payload.id,
                    partnerId: payload.partnerId,
                    sort: payload.sort,
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

export const getFileBufferReportForBooking = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/list-all-booking/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    // sortField: payload.sortField,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    credentialId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getDownloadTicket = async (payload: DownloadTicketPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/download-bookingTicket?orderId=${payload.orderId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
