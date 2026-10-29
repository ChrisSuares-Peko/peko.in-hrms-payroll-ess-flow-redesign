import { SuccessGenericResponse } from '@customtypes/general';
import {
    HotelCancellationPolicy,
    cancellationPolicyResponse,
    otpPayload,
    paymentRequest,
} from '@domains/dashboard/Hotels/types/cancellationTypes';
import { HotelSearch, getSearchDetailsPayload } from '@domains/dashboard/Hotels/types/hotelTypes';
import { bookingData } from '@domains/dashboard/Hotels/types/managebookingTypes';
import { ApiClient } from '@src/services/config';

import {
    CityData,
    UserDetailsPayload,
    bookings,
    cancelBooking,
    cancelStatus,
    cancellation,
    cancellationData,
    countrySearchPayload,
    employeeResponse,
    searchList,
    ticket,
} from '../types/types';

export const getHotels = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<searchList> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/hotelSearch`,
            payload
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const fetchCityData = async (payload: countrySearchPayload) => {
    try {
        const reqbody = {
            CountryCode: payload.CountryCode,
        };
        const resp: SuccessGenericResponse<CityData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/cities`,
            reqbody
        );

        const { data } = resp;
        return data;
    } catch (error) {
        return false;
    }
};

export const fetchCountryData = async (payload: any) => {
    try {
        const resp: SuccessGenericResponse<CityData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/hotels/countries`
        );

        const { data } = resp;
        return data;
    } catch (error) {
        return false;
    }
};

// export const fetchBookings = async(payload)
export const hotelAndRoomDetails = async (payload: getSearchDetailsPayload) => {
    const reqbody = {
        Hotelcodes: payload.Hotelcodes,
    };
    try {
        const resp: SuccessGenericResponse<HotelSearch> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/hotelDetails`,
            reqbody
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const prebookHotel = async (payload: any) => {
    try {
        const reqbody = {
            BookingCode: payload.BookingCode,
            amount: payload.amount,
        };
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/preBook`,
            reqbody
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const allBookings = async (payload: bookings) => {
    try {
        const resp: SuccessGenericResponse<bookingData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/hotels/list-all-bookings`,
            {
                params: {
                    from: '',
                    to: '',
                    searchText: '',
                    sort: '',
                    page: payload.currentPage,
                    filter: '',
                    itemsPerPage: 4,
                },
            }
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const cancellationCharge = async (payload: cancellation) => {
    try {
        const resp: SuccessGenericResponse<cancellationData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/cancellation-charge`,
            payload
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const cancelbookings = async (payload: cancelBooking) => {
    try {
        const resp = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/cancelRequest`,
            payload
        );

        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const CancelStatus = async (payload: cancelStatus) => {
    try {
        const resp = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/cancellation-status`,
            payload
        );

        // const { data } = resp;
        return resp;
    } catch (err) {
        return false;
    }
};
export const getotp = async (payload: otpPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/hotels/hotel-cancel/get-otp`,
            {
                params: {
                    scope: payload.scope,
                },
            }
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const cancellationPolicy = async (payload: cancellationPolicyResponse) => {
    try {
        const resp: SuccessGenericResponse<HotelCancellationPolicy> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/hotels/cancellationPolicy`,
            payload
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const bookRoom = async (payload: paymentRequest) => {
    const resp: SuccessGenericResponse<any> = await ApiClient.post(
        `${payload.userType}/${payload.userId}/travel/hotels/book`,
        payload
    );

    const { data } = resp;
    return data;
};

export const downloadTicket = async (payload: ticket) => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/hotels/download-bookingTicket?orderId=${payload.orderId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

// The backend compares the vendor wallet balance against `amount` and only reports pass/fail —
// on failure the API interceptor toasts the backend's (generic) error message.
export const tboBalance = async (payload: { userId: number; userType: string; amount: number }) => {
    try {
        await ApiClient.post(`${payload.userType}/${payload.userId}/travel/hotels/balance`, {
            amount: payload.amount,
        });
        return true;
    } catch (err) {
        return false;
    }
};
export const getEmployees = async (payload: UserDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<employeeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payroll/employee/current-employees?searchText=`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
