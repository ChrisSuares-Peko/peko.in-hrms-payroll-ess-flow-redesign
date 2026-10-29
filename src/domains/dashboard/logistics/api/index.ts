import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ICalculateRateResponse,
    // ICityListingResponse,
    // ICountryListingResponse,
    // IServiceTypeListingResponse,
    IStateListingResponse,
    calculateRatePayload,
    // logisticsCityListing,
    // logisticsCountryListing,
    // logisticsServiceTypeListing,
    logisticsStateListing,
    trackShipmentPayload,
} from '../types/index';
import { TransactionsRequestPayload, TransactionsResponse } from '../types/orderHistory';
import { CheckPincodeRequestPayload, CheckPincodeResponse } from '../types/pincode';
import {
    ITrackShipmentResponse,
    UpdateShipmentPayload,
    UpdateShipmentStatusPayload,
    UpdateShipmentStatusResponse,
} from '../types/tracking';

export const stateListing = async (payload: logisticsStateListing) => {
    try {
        const res: SuccessGenericResponse<IStateListingResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/logistics/fetchStates`,
            {
                params: {
                    searchText: payload.searchText || '',
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const calculateRate = async ({ userType, userId, ...payload }: calculateRatePayload) => {
    try {
        const res: SuccessGenericResponse<ICalculateRateResponse> = await ApiClient.post(
            `${userType}/${userId}/travel/logistics/calculateRate`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const trackShipment = async ({ userType, userId, providerId }: trackShipmentPayload) => {
    try {
        const res: SuccessGenericResponse<ITrackShipmentResponse> = await ApiClient.get(
            `${userType}/${userId}/travel/logistics/trackShipment/${providerId}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateShipmentStatusApi = async ({
    userType,
    userId,
    updateType,
    orderId,
}: UpdateShipmentStatusPayload) => {
    try {
        const res: SuccessGenericResponse<UpdateShipmentStatusResponse> = await ApiClient.put(
            `${userType}/${userId}/travel/logistics/order/${orderId}`,
            { updateType }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const updateOrderApi = async ({
    userType,
    userId,
    orderId,
    nextDeliveryDate,
    customerMobileNo,
    customerAddress,
}: UpdateShipmentPayload) => {
    try {
        const res: SuccessGenericResponse<UpdateShipmentStatusResponse> = await ApiClient.put(
            `${userType}/${userId}/travel/logistics/recieverAddress/${orderId}`,
            { nextDeliveryDate, customerMobileNo, customerAddress, orderStatus: 'RETRY' }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getTransactionsApi = async (payload: TransactionsRequestPayload) => {
    try {
        const res: SuccessGenericResponse<TransactionsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/travel/logistics/orders`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.search,
                    from: payload.from,
                    to: payload.to,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const checkPinApi = async ({ userType, userId, ...payload }: CheckPincodeRequestPayload) => {
    try {
        const res: SuccessGenericResponse<CheckPincodeResponse> = await ApiClient.post(
            `${userType}/${userId}/travel/logistics/checkPincode`,
            payload
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};
