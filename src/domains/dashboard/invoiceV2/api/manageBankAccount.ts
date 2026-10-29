import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AddDomesticAccountFormValues, DomesticAccount } from '../types/ManageBankAccounts';

const isValidDomesticAccount = (account: DomesticAccount) =>
    account.accountNumber?.trim().toLowerCase() !== 'not available';

export const getBankAccountsApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<{ bankDetails: DomesticAccount[] }> =
            await ApiClient.get(`${userType}/${userId}/others/profile/bank`);
        if (!resp.status) return resp as unknown as SuccessGenericResponse<DomesticAccount[]>;
        return {
            ...resp,
            data: (resp.data?.bankDetails ?? []).filter(isValidDomesticAccount),
        } as SuccessGenericResponse<DomesticAccount[]>;
    } catch {
        return false;
    }
};

export const setPrimaryBankAccountApi = async (
    payload: UserPayload & { account: DomesticAccount; otp: string }
) => {
    try {
        const { userId, userType, account, otp } = payload;
        const resp: SuccessGenericResponse<{ updatedBank: number[] }> = await ApiClient.put(
            `${userType}/${userId}/others/profile/bank`,
            {
                id: account.id,
                accountHolderName: account.accountHolderName,
                bankName: account.bankName,
                accountNumber: account.accountNumber,
                ifscCode: account.ifscCode,
                accountType: account.accountType,
                bankBranch: account.bankBranch,
                default: true,
                scope: 'email',
                otp,
            }
        );
        return resp;
    } catch {
        return false;
    }
};

export const deleteBankAccountApi = async (
    payload: UserPayload & { accountId: string; otp: string }
) => {
    try {
        const { userId, userType, accountId, otp } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${userType}/${userId}/others/profile/bank/${accountId}`,
            { params: { scope: 'email', otp } }
        );
        return resp;
    } catch {
        return false;
    }
};

export const editBankAccountApi = async (
    payload: UserPayload &
        AddDomesticAccountFormValues & { accountId: string; otp: string; isDefault: boolean }
) => {
    try {
        const { userId, userType, accountId, isDefault, ...body } = payload;
        const resp: SuccessGenericResponse<{ updatedBank: number[] }> = await ApiClient.put(
            `${userType}/${userId}/others/profile/bank`,
            { ...body, id: Number(accountId), default: isDefault, scope: 'email' }
        );
        return resp;
    } catch {
        return false;
    }
};

export const sendBankAccountOtpApi = async (
    payload: UserPayload & { accountNumber: string; selectedId?: string; method?: string }
) => {
    try {
        const { userId, userType, accountNumber, selectedId, method } = payload;
        const resp: SuccessGenericResponse<{ otp: string }> = await ApiClient.get(
            `${userType}/${userId}/others/profile/otp-bank-details`,
            {
                params: {
                    scope: 'email',
                    accountNumber,
                    ...(method && { method }),
                    ...(selectedId && { selectedId }),
                },
            }
        );
        return resp;
    } catch {
        return false;
    }
};

export const addBankAccountApi = async (
    payload: UserPayload & AddDomesticAccountFormValues & { otp: string }
) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<DomesticAccount> = await ApiClient.post(
            `${userType}/${userId}/others/profile/bank`,
            { ...body, default: false, scope: 'email' }
        );
        return resp;
    } catch {
        return false;
    }
};
