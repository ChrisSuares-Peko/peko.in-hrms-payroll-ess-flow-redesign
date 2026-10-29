import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    RemoveFundsListResponse,
    RemoveFundsPayload,
    RemoveFundsResponse,
    OnboardVirtualAccountPayload,
    VirtualAccountBalance,
    VirtualAccountRecord,
} from '../../types/virtualAccount';

export const onboardVirtualAccountApi = async (
    payload: OnboardVirtualAccountPayload & UserPayload
) => {
    try {
        const { userId, userType, ...rest } = payload;
        const resp: SuccessGenericResponse<VirtualAccountRecord> = await ApiClient.post(
            `${userType}/${userId}/payroll/account/virtual/onboard`,
            rest
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getVirtualAccountStatusApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<VirtualAccountRecord> = await ApiClient.get(
            `${userType}/${userId}/payroll/account/virtual/status`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getVirtualAccountBalanceApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<VirtualAccountBalance> = await ApiClient.get(
            `${userType}/${userId}/payroll/account/virtual/balance`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const removeFundsFromVirtualAccountApi = async (
    payload: RemoveFundsPayload & UserPayload
) => {
    try {
        const { userId, userType, ...rest } = payload;
        const resp: SuccessGenericResponse<RemoveFundsResponse> = await ApiClient.post(
            `${userType}/${userId}/payroll/account/virtual/remove-funds`,
            rest
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

export const getRemoveFundsRequestsApi = async (
    payload: UserPayload & { page?: number; limit?: number }
) => {
    try {
        const { userId, userType, page = 1, limit = 10 } = payload;
        const resp: SuccessGenericResponse<RemoveFundsListResponse> = await ApiClient.get(
            `${userType}/${userId}/payroll/account/virtual/remove-funds`,
            { params: { page, limit } }
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};

export const getRemoveFundsRequestStatusApi = async (
    payload: UserPayload & { referenceId: string }
) => {
    try {
        const { userId, userType, referenceId } = payload;
        const resp: SuccessGenericResponse<RemoveFundsResponse> = await ApiClient.get(
            `${userType}/${userId}/payroll/account/virtual/remove-funds/${referenceId}/status`
        );
        const { data } = resp;
        return data;
    } catch {
        return false;
    }
};
