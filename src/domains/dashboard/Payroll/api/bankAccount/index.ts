import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    BankAccountRecord,
    BankTransaction,
    SalaryRolloutBankAccount,
    SalaryRolloutBankPayload,
    VerifyBankAccountPayload,
} from '../../types/bankAccount';

export const verifyBankAccountApi = async (
    payload: VerifyBankAccountPayload & UserPayload
) => {
    try {
        const { userId, userType, ...rest } = payload;
        const resp: SuccessGenericResponse<BankAccountRecord> = await ApiClient.post(
            `${userType}/${userId}/payroll/account/bank/verify`,
            rest
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getBankAccountStatusApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<BankAccountRecord> = await ApiClient.get(
            `${userType}/${userId}/payroll/account/bank/status`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

const rolloutBase = (userType: string, userId: string | number) =>
    `${userType}/${userId}/payroll/salary-rollout-banks`;

export const listSalaryRolloutBanksApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<SalaryRolloutBankAccount[]> = await ApiClient.get(
            rolloutBase(userType, userId)
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const addSalaryRolloutBankApi = async (
    payload: UserPayload & SalaryRolloutBankPayload
) => {
    try {
        const { userId, userType, ...rest } = payload;
        const resp: SuccessGenericResponse<SalaryRolloutBankAccount> = await ApiClient.post(
            rolloutBase(userType, userId),
            rest
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateSalaryRolloutBankApi = async (
    payload: UserPayload & SalaryRolloutBankPayload & { id: string }
) => {
    try {
        const { userId, userType, id, ...rest } = payload;
        const resp: SuccessGenericResponse<SalaryRolloutBankAccount> = await ApiClient.put(
            `${rolloutBase(userType, userId)}/${id}`,
            rest
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const deleteSalaryRolloutBankApi = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType, id } = payload;
        await ApiClient.delete(`${rolloutBase(userType, userId)}/${id}`);
        return true;
    } catch (err) {
        return false;
    }
};

export const setPrimaryBankApi = async (payload: UserPayload & { id: string }) => {
    try {
        const { userId, userType, id } = payload;
        const resp: SuccessGenericResponse<SalaryRolloutBankAccount> = await ApiClient.patch(
            `${rolloutBase(userType, userId)}/${id}/set-primary`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const listBankTransactionsApi = async (
    payload: UserPayload & { startDate?: string; endDate?: string; search?: string }
) => {
    try {
        const { userId, userType, startDate, endDate, search } = payload;
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (search) params.append('search', search);
        const query = params.toString() ? `?${params.toString()}` : '';
        const resp: SuccessGenericResponse<BankTransaction[]> = await ApiClient.get(
            `${userType}/${userId}/payroll/account/transactions${query}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
