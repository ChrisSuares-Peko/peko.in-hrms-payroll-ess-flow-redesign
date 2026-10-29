import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CreatePGMethodsByService,
    CreatePGMethodsByServiceResponse,
    EditPGMethodsByService,
    FilterType,
    GatewayProvider,
    PaymentMethodsResponse,
    PaymentMethodsState,
    UpdatePaymentMethodStatus,
} from '../types/paymentMethods';

export const getPaymentMethodsApi = async (payload: UserPayload & FilterType) => {
    try {
        const resp: SuccessGenericResponse<PaymentMethodsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/payment-methods`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                    partnerId: payload.partnerId,
                    pgProvider: payload.pgProvider || undefined,
                    paymentMethod: payload.paymentMethod || undefined,
                    isActive: payload.isActive || undefined,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updatePaymentMethodsApi = async ({
    userId,
    userType,
    ...payload
}: UserPayload & PaymentMethodsState) => {
    try {
        const resp: SuccessGenericResponse<PaymentMethodsState> = await ApiClient.put(
            `${userType}/${userId}/payment-gateway/payment-methods/update`,
            payload
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createPaymentMethodsByService = async ({
    userId,
    userType,
    ...payload
}: UserPayload & CreatePGMethodsByService) => {
    try {
        const resp: SuccessGenericResponse<CreatePGMethodsByServiceResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/payment-methods/create`,
            payload
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updatePaymentMethodsByService = async ({
    userId,
    userType,
    ...payload
}: UserPayload & EditPGMethodsByService) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${userType}/${userId}/payment-gateway/payment-methods/edit/${payload.rowIdToUpdate}`,
            payload
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updatePaymentMethodStatusApi = async ({
    userId,
    userType,
    paymentMethodId,
    isActive,
}: UserPayload & UpdatePaymentMethodStatus) => {
    try {
        const resp: SuccessGenericResponse<UpdatePaymentMethodStatus> = await ApiClient.put(
            `${userType}/${userId}/payment-gateway/payment-methods/status/${paymentMethodId}`,
            { isActive }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

// export const getPaymentGatewaysApi = async ({ userId, userType }: UserPayload) => {
//     try {
//         const resp: SuccessGenericResponse<PaymentGateway[]> = await ApiClient.get(
//             `${userType}/${userId}/payment-gateway/payment-methods/gateways`
//         );
//         return resp.data;
//     } catch (err) {
//         return false;
//     }
// };

export const getPaymentGatewaysApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<GatewayProvider[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/payment-methods/gateways`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
