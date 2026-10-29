import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../../types';

export const updateTicketPriceApi = async ({
    userId,
    userType,
    bookingId,
    ...payload
}: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/travel/flight/modification-request/price-update?id=${bookingId}`,
            { ...payload }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateFlightTicketApi = async ({
    userId,
    userType,
    bookingId,
    ...payload
}: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/travel/flight/modification-request/ticket-update?id=${bookingId}`,
            { ...payload }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const rejectModificationPaymentApi = async ({
    userId,
    userType,
    bookingId,
}: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/travel/flight/modification-request/cancel-and-refund?id=${bookingId}`
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
            `${payload.userType}/${payload.userId}/travel/flight/list-modification-requests/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
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
