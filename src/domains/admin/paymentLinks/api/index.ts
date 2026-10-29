import { CommonFileBuffer, SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export const sendEmail = async (payload: any) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<boolean> = await ApiClient.post(
            `${userType}/${userId}/payment/payment-links/sendMail`,
            {
                ...restPayload,
            }
        );
        const { status } = resp;
        return status;
    } catch (err) {
        return false;
    }
};

export const CreateLink = async (payload: any) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/ni-payments/create-payment-link`,
            {
                ...restPayload,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const ResendLink = async (payload: {
    userId: number;
    userType: string;
    paymentRefId: number;
}) => {
    try {
        const { ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment-gateway/ni-payments/resend-payment-link/${payload.paymentRefId}`,
            restPayload
        );
        const { status } = resp;
        return status;
    } catch (err) {
        return false;
    }
};

export const getAllPaymentLinks = async (payload: any) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/all`,
            {
                params: {
                    ...restPayload,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReport = async (payload: any) => {
    const { userId, userType, ...restPayload } = payload;
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/payment/payment-links/${payload.type}`,
            {
                params: {
                    ...restPayload,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
