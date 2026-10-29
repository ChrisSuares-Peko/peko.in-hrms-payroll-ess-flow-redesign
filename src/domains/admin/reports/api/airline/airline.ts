import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { CancelationCharge } from '@src/domains/dashboard/Airline/types/manageBookings';
import { ApiClient } from '@src/services/config';

import { getData } from '../../types';
import { airlineDataResponse } from '../../types/airline';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<airlineDataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/list-cancelled-booking`,
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

export const getAllModificationData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<airlineDataResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/list-modification-requests`,
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
export const getOneModificationData = async (payload: UserPayload, bookingId: number | string) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/modification-request`,
            {
                params: {
                    id: bookingId,
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
            `${payload.userType}/${payload.userId}/travel/flight/list-cancelled-booking/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    sortField: payload.sortField,
                    searchText: payload.searchText,
                    to: payload.to,
                    from: payload.from,
                    credentialId: payload.id,
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

export const refundApi = async ({ userId, userType, ...payload }: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/travel/flight/refund-cancelled-booking`,
            { ...payload }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const cancellationChargesApi = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<CancelationCharge> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/cancellation-charge`,
            { id: payload.flightBookingId }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
