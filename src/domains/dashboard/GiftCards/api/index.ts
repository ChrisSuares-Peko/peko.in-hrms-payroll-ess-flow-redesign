import { SuccessGenericResponse } from '@customtypes/api';
import { ApiClient } from '@src/services/config';

import { employeeResponse } from '../types/employee';
import {
    GiftcardListResponse,
    GetGiftcardListPayload,
    giftCardDetailPayload,
    PurchasePayload,
    PurchaseResponse,
    PaymentPayload,
    // PaymentResponse,
    walletPayload,
    WalletBalanceResponse,
    SurchargeResponse,
    CodeIssueResponse,
    OrderHistoryListResponse,
    OrderHistoryTablePayload,
    GiftCardDetailResponse,
    UserDetailsPayload,
    XoxodayBalancePayload,
} from '../types/types';

// export const getGiftcards = async (payload: GetGiftcardListPayload) => {
//     try {
//         const userType = encodeURIComponent(payload.userType); // Encode user type to handle special characters
//         const userId = encodeURIComponent(payload.userId.toString()); // Encode user ID to handle special characters and ensure it's a string
//         const offset = (payload.page - 1) * payload.limit;
//          const accessKeys = encodeURIComponent('["gift-card","xoxoday"]');

//         const url = `${userType}/${userId}/purchase/giftCards/?page=${payload.page}&offset=${offset}&limit=${payload.limit}&sortBy=${payload.category}&searchText=${payload.searchText}&accessKeys=${accessKeys} `;

//         const resp: SuccessGenericResponse<GiftcardListResponse> = await ApiClient.get(url);

//         const { data } = resp;

//         return data;
//     } catch (err) {
//         return false;
//     }
// };
export const getGiftcards = async (payload: GetGiftcardListPayload) => {
    try {
        const userType = encodeURIComponent(payload.userType); // Encode user type to handle special characters
        const userId = encodeURIComponent(payload.userId.toString()); // Encode user ID to handle special characters and ensure it's a string
        const accessKeys = encodeURIComponent('["gift-card","xoxoday"]');
        const offset = (payload.page - 1) * payload.limit;

        const categoryParam =
            payload.categoryFilter && payload.categoryFilter !== 'all'
                ? `&category=${payload.categoryFilter}`
                : '';
        const url = `${userType}/${userId}/purchase/giftcards/all?accessKeys=${accessKeys}&page=${payload.page} &offset=${offset}&limit=${payload.limit}&sortBy=${payload.category}&searchValue=${payload.searchText}${categoryParam} `;

        const resp: SuccessGenericResponse<GiftcardListResponse> = await ApiClient.get(url);
        return resp.data;
    } catch (_err) {
        return false;
    }
};

export const getGiftDetails = async (payload: giftCardDetailPayload) => {
    try {
        const resp: SuccessGenericResponse<GiftCardDetailResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/giftCards/${payload.cardID}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const makePreorder = async (
    payload: PurchasePayload
): Promise<PurchaseResponse | Boolean> => {
    try {
        const resp: SuccessGenericResponse<PurchaseResponse> = await ApiClient.post(
            `${payload.userType}/${payload.credentialId}/purchase/giftCards/preorder`,
            payload
        );
        const { status } = resp;

        return status;
    } catch (err) {
        console.error('Failed to make the preorder:', err);
        return false;
    }
};

export const makePayment = async (payload: PaymentPayload): Promise<boolean> => {
    try {
        const resp: SuccessGenericResponse<boolean> = await ApiClient.post(
            `${payload.userType}/${payload.credentialId}/purchase/giftCards/payment`,
            payload
        );
        const { status } = resp;

        return status;
    } catch (err) {
        console.error('Failed to make the payment:', err);
        return false;
    }
};

export const getWalletBalance = async (payload: walletPayload) => {
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
export const getSurcharge = async (payload: walletPayload) => {
    try {
        const resp: SuccessGenericResponse<SurchargeResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/payment-gateway/surcharge?accessKey=subscription_payments`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCodeIssue = async (payload: giftCardDetailPayload) => {
    try {
        const resp: SuccessGenericResponse<CodeIssueResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/giftCards/confirm/${payload.cardID}`
        );

        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getOrderHistoryTable = async (payload: OrderHistoryTablePayload) => {
    try {
        const resp: SuccessGenericResponse<OrderHistoryListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/giftCards/transactions?sort=DESC`,
            {
                params: {
                    searchText: payload.search,
                    page: payload.start,
                    itemsPerPage: payload.length,
                },
            }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getXoxodayBalance = async (payload: XoxodayBalancePayload) => {
    try {
        await ApiClient.post(`${payload.userType}/${payload.userId}/purchase/giftCards/balance`, {
            serviceOperatorId: payload.serviceOperatorId,
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
