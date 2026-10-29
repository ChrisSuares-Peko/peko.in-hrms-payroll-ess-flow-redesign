import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DownloadTicketPayload, getData } from '../../types';

export const getAllBookingData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/hotels/list-all-booking`,
            {
                params: {
                    page: payload.page,
                    limit: payload.itemsPerPage,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                    credentialId: payload.id,
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
            `${payload.userType}/${payload.userId}/travel/hotels/list-all-booking/${payload.type}`,
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
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/hotels/download-bookingTicket?orderId=${payload.orderId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
