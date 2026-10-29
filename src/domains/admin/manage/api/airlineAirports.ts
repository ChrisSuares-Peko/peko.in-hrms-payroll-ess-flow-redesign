import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export type GetAirlineAirportsPayload = UserPayload & {
    page: number;
    itemsPerPage: number;
    sort: string;
    sortField: string;
    searchText: string;
};

export type UpdateAirportPriorityPayload = UserPayload & {
    id: number | string;
    priority: number | null;
};

export type CreateAirportPayload = UserPayload & {
    airportCode: string;
    airportName: string;
    cityCode?: string;
    cityName: string;
    countryCode?: string;
    countryName: string;
    priority?: number | null;
};

export const getAirlineAirports = async (payload: GetAirlineAirportsPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/airports`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    searchText: payload.searchText,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const createAirlineAirport = async ({
    userId,
    userType,
    ...payload
}: CreateAirportPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/travel/flight/airports`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateAirlineAirportPriority = async ({
    userId,
    userType,
    id,
    priority,
}: UpdateAirportPriorityPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.patch(
            `${userType}/${userId}/travel/flight/airports/${id}`,
            { priority }
        );
        return resp.data;
    } catch {
        return false;
    }
};
