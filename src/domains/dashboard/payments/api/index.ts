import { ErrorGenericResponse, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    PaymentGeneric,
    CardPaymentResponse,
    WalletBalanceResponse,
    PaymentResponse,
    TransactionDetailsResponse,
    TransactionDetailsPayload,
    PaytmCreateOrderPayload,
    PaytmCreateOrderResponse,
    BulkPaymentStatusResp,
    CheckAgencyBalance,
    PaymentMethodsResponse,
    CCavenueInitiateResponse,
    MswipeInitiateResponse,
    RazorpayCreateOrderResponse,
} from '../types/index';

export const createPaymentLink = async (payload: PaymentGeneric & UserPayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: CardPaymentResponse = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/plural-gateway/create-order`,
            restPayload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getWalletBalance = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<WalletBalanceResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/walletDetails`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const createPGTransaction = async (payload: UserPayload & PaytmCreateOrderPayload) => {
    try {
        const resp: SuccessGenericResponse<PaytmCreateOrderResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment-gateway/cashfree-gateway/create-order`,
            payload
        );
        return resp;
    } catch (err: any) {
        const errBody = err?.response?.data;
        if (errBody && errBody.status === false) {
            return errBody;
        }
        return false;
    }
};

export const createSubscriptionOrderFromPayments = async (payload: UserPayload & Record<string, any>) => {
    try {
        const { userId, userType, ...rest } = payload;
        const resp: SuccessGenericResponse<{ session_id: string }> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/cashfree-gateway/create-subscription-order`,
            rest
        );
        return resp;
    } catch (err: any) {
        // Propagate a structured backend rejection (e.g. the ₹14,999 auto-pay per-payment limit) so the
        // caller can show its specific message instead of a generic "Something went wrong" toast.
        const errBody = err?.response?.data;
        if (errBody && errBody.status === false) {
            return errBody;
        }
        return false;
    }
};

export const createRazorpayOrder = async (payload: UserPayload & PaytmCreateOrderPayload) => {
    try {
        const resp: SuccessGenericResponse<RazorpayCreateOrderResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/payment-gateway/razorpay-gateway/create-order`,
            payload
        );
        return resp;
    } catch (err: any) {
        const errBody = err?.response?.data;
        if (errBody && errBody.status === false) {
            return errBody;
        }
        return false;
    }
};

// Every gateway's /complete answers in the same shape; only the path differs.
const completePGPaymentAt = async (path: string, payload: PaymentGeneric & UserPayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/${path}`,
            restPayload
        );
        const { data } = resp;
        return data;
    } catch (err: any) {
        const errStatus = err?.response?.status;
        const errBody = err?.response?.data;
        if (errStatus === 400 && errBody && errBody.status === false) {
            // responseCode/message sit on the envelope, not inside `data`.
            return {
                failed: true,
                responseCode: errBody.responseCode,
                failureMessage: errBody.message,
                ...(errBody.data || {}),
            } as PaymentResponse;
        }
        return false;
    }
};

export const completePGPayment = (payload: PaymentGeneric & UserPayload) =>
    completePGPaymentAt('cashfree-gateway/complete', payload);

export const completeRazorpayPayment = (payload: PaymentGeneric & UserPayload) =>
    completePGPaymentAt('razorpay-gateway/complete', payload);

// Gateway-blind: the backend routes by the gateway the order was created on.
export const completeAnyPGPayment = (payload: PaymentGeneric & UserPayload) =>
    completePGPaymentAt('complete', payload);

export const doWalletPayment = async (
    payload: PaymentGeneric & UserPayload & { url: string },
    // Optional; failures still resolve to `false`, so existing callers are unaffected.
    onError?: (error: ErrorGenericResponse | undefined) => void
) => {
    try {
        const { userId, userType, url, ...restPayload } = payload;
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/${url}`,
            restPayload
        );
        // Some endpoints (e.g. visa) return their fields flat instead of nested
        // under `data` — fall back to the whole response body in that case.
        return resp?.data ?? (resp as unknown as PaymentResponse);
    } catch (err) {
        onError?.((err as { response?: { data?: ErrorGenericResponse } })?.response?.data);
        return false;
    }
};

// Corporate card leg: same body as a gateway create-order, one round trip. A decline comes back HTTP 200
// with data.declined and the card's reason, so the interceptor stays quiet and the page can say why.
export const doCorporateCardPayment = async (
    payload: PaymentGeneric & UserPayload & { pgAmount: number },
    onError?: (error: ErrorGenericResponse | undefined) => void
) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/corporate-card-gateway/pay`,
            restPayload
        );
        return resp?.data ?? (resp as unknown as PaymentResponse);
    } catch (err) {
        onError?.((err as { response?: { data?: ErrorGenericResponse } })?.response?.data);
        return false;
    }
};

export const getTransactionDetails = async (payload: UserPayload & TransactionDetailsPayload) => {
    try {
        const resp: SuccessGenericResponse<TransactionDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/transactions/details/${payload.transactionId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getBulkPaymentDataApi = async (
    payload: UserPayload,
    esimStoredBatchId: string | null
) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/bulk-payment/bulkPaymentData/${esimStoredBatchId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getBulkPaymentStatusApi = async (payload: UserPayload, batchId: number) => {
    try {
        const resp: SuccessGenericResponse<BulkPaymentStatusResp> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/bulk-payment/status/${batchId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const checkAgencyBalanceApi = async (payload: CheckAgencyBalance) => {
    try {
        await ApiClient.post(
            `${payload.userType}/${payload.userId}/travel/flight/validate-amount`,
            {
                amount: payload.amount,
                passengers: payload.passengers,
                traceId: payload.traceId,
            }
        );
        return true;
    } catch (err) {
        return false;
    }
};

export const getSubscriptionTransactionStatusApi = async (
    payload: UserPayload & { transactionId: string; paymentRefId?: string }
) => {
    try {
        const query = payload.paymentRefId ? `?paymentRefId=${payload.paymentRefId}` : '';
        const resp: SuccessGenericResponse<{ corporateTxnId: string; status: string }> =
            await ApiClient.get(
                `${payload.userType}/${payload.userId}/others/transactions/subscriptionStatus/${payload.transactionId}${query}`
            );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const initiateCCavenuePayment = async (payload: PaymentGeneric & UserPayload & { pgAmount: number; url?: string | null }) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<CCavenueInitiateResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/ccavenue-gateway/initiate`,
            restPayload
        );
        return resp.data;
    } catch (err: any) {
        const errBody = err?.response?.data;
        if (errBody && errBody.status === false) {
            return errBody;
        }
        return false;
    }
};

export const completeCCavenuePayment = async (payload: { userId: number; userType: string; orderId: string }) => {
    try {
        const { userId, userType, orderId } = payload;
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/ccavenue-gateway/complete`,
            { orderId }
        );
        return resp.data;
    } catch (err: any) {
        const errStatus = err?.response?.status;
        const errBody = err?.response?.data;
        if (errStatus === 400 && errBody && errBody.status === false) {
            return { failed: true, ...(errBody.data || {}) } as PaymentResponse;
        }
        return false;
    }
};

export const initiateMswipePayment = async (
    payload: UserPayload & PaytmCreateOrderPayload
): Promise<MswipeInitiateResponse | false> => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<MswipeInitiateResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/mswipe-gateway/create-order`,
            restPayload
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const completeMswipePayment = async (payload: PaymentGeneric & UserPayload) => {
    try {
        const { userId, userType, ...restPayload } = payload;
        const resp: SuccessGenericResponse<PaymentResponse> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/mswipe-gateway/complete`,
            restPayload
        );
        return resp.data;
    } catch (err: any) {
        const errStatus = err?.response?.status;
        const errBody = err?.response?.data;
        if (errStatus === 400 && errBody && errBody.status === false) {
            return {
                failed: true,
                responseCode: errBody.responseCode,
                failureMessage: errBody.message,
                ...(errBody.data || {}),
            } as PaymentResponse;
        }
        return false;
    }
};

export const fetchAvailablePgMethods = async (payload: UserPayload & { accessKey: string, billerId?:string }) => {
    try {
        const resp: SuccessGenericResponse<PaymentMethodsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/payment-methods`,
            {
                params: {
                    accessKey: payload.accessKey,
                    billerId: payload?.billerId,
                },
            }
        );

        const { data } = resp;
        return data;
    } catch (error) {
        return false; // Return false in case of an error
    }
};
