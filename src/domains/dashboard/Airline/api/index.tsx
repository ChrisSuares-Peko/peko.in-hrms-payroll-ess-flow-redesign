import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { IFlightSearchResponse } from '../types/airlineList';
import { AncillarySearch } from '../types/ancilaryType';
import { AncProvBookSuccessResponse } from '../types/ancProvBookSuccess';
import {
    APIPayload,
    BookingDetailsRes,
    CountryList,
    DownloadTicketPayload,
    FareRulePayload,
    FetchCancelationCharge,
    GetBookingDetailsPayload,
    GetBookingsListPayload,
    IAncCancellationPayload,
    IAncProvBookPayload,
    IAncSearchPayload,
    otpPayload,
    SearchAirportPayload,
} from '../types/apiPayloadTypes';
import { BookingListRes, CancelationCharge } from '../types/manageBookings';
import { ProvBookingSuccess } from '../types/provBooking';
import { AirportSearchResult } from '../types/searchAirports';

export const getFareCalendarAPI = async (payload: any) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/fare-calendar`,
            payload.reqData,
            { skipErrorToast: true }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};


export const getOneWaySearch = async (payload: any) => {
    try {
        const reqData = payload.tripDetails;
        const res: SuccessGenericResponse<IFlightSearchResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/searchTicket`,
            reqData
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getSearchAirport = async (payload: SearchAirportPayload) => {
    try {
        const res: SuccessGenericResponse<AirportSearchResult> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/airports?q=${payload.loc}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getBookingsList = async (payload: GetBookingsListPayload) => {
    const emptyBookings: BookingListRes = {
        page: payload.page,
        limit: 10,
        count: 0,
        bookings: [],
    };
    try {
        const res: SuccessGenericResponse<BookingListRes> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/list-all-bookings?page=${payload.page}&limit=10&availability=${payload.availability}`,
            {
                validateStatus: status =>
                    (status >= 200 && status < 300) || status === 400,
            }
        );
        if (res?.status && res?.data) {
            return res.data;
        }
        return emptyBookings;
    } catch (error) {
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

export const fetchCancelationChargeApi = async (payload: FetchCancelationCharge) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/cancelation_charge?bookingId=${payload.bookingId}`
        );
        return res;
    } catch (error) {
        return false;
    }
};

export const getCancelBooking = async (payload: IAncCancellationPayload) => {
    try {
        const { postData } = payload;
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/cancel`,
            postData
        );
        return res;
    } catch (error) {
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

export const updateBooking = async (payload: DownloadTicketPayload) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/update-status?bookingId=${payload.orderId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getProvBooking = async (payload: any) => {
    try {
        const postData = payload.bookingData;
        const res: SuccessGenericResponse<ProvBookingSuccess> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/provBook`,
            postData
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getWalletBalance = async (payload: APIPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/walletDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const airlinePaymentsApi = async (payload: any) => {
    try {
        const postData = payload.paymentRequestData;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/payment`,
            postData
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return err.response.data.data;
    }
};

export const ancillariesSearchAPI = async (payload: IAncSearchPayload) => {
    try {
        const { postData } = payload;

        const resp: SuccessGenericResponse<AncillarySearch> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/ancSearch`,
            postData
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return err.response.data.data;
    }
};

export const ancillariesProvBookingAPI = async (payload: IAncProvBookPayload) => {
    try {
        const { postData } = payload;

        const resp: SuccessGenericResponse<AncProvBookSuccessResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/ancProBook`,
            postData
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return err.response.data.data;
    }
};

export const getCountriesAPI = async () => {
    try {
        const resp: SuccessGenericResponse<CountryList> = await ApiClient.get(
            `user/general/country-codes`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCountriesPhoneCodeAPI = async () => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(`user/general/phone-codes`);
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFareRulesAPI = async (payload: FareRulePayload) => {
    try {
        const { TraceId, ResultIndex, InbountResultIndex } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/fetch_fareRules`,
            {
                TraceId,
                ResultIndex,
                InbountResultIndex,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getBookingDetailsApi = async (payload: GetBookingDetailsPayload) => {
    try {
        const res: SuccessGenericResponse<BookingDetailsRes> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/booking-details?id=${payload?.id}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

type Booking = APIPayload & {
    payload: any;
};
export const postBooking = async (values: Booking) => {
    try {
        const { payload } = values;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${values.userType}/${values.userId}/travel/flight/booking`,
            {
                data: payload,
            }
        );

        // const resp = {
        //     data: {
        //         PNR: 'B7SXNF',
        //         BookingId: 1970391,
        //         isPriceChanged: true,
        //         isTimeChanged: true,
        //         passengerFares: [
        //             {
        //                 PaxType: 1,
        //                 Fare: {
        //                     BaseFare: 90110,
        //                     AdditionalTxnFeeOfrd: 0,
        //                     AdditionalTxnFeePub: 0,
        //                     Tax: 9044,
        //                     YQTax: 0,
        //                 },
        //             },
        //         ],
        //         fare: {
        //             BaseFare: 12000,
        //             Tax: 1200,
        //             PublishedFare: 13200,
        //         },
        //         schedule: {
        //             ArrTime: new Date(),
        //             DeptTime: new Date(),
        //         },
        //     },
        // };
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const fetchSSRAPI = async (values: any) => {
    try {
        const { payload } = values;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${values.userType}/${values.userId}/travel/flight/SSR`,
            {
                data: payload,
            }
        );
        return resp?.data ?? false;
    } catch (err) {
        return false;
    }
};

export const getotp = async (payload: otpPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/flight/cancel/get-otp`,
            {
                params: {
                    scope: payload.scope,
                    id: payload.id,
                },
            }
        );

        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
