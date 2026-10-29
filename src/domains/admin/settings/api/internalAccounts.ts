import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    AddInternalAccountsPayload,
    ApiResponseAllAccounts,
    ApiResponseInternalAccounts,
    getInternalAccounts,
} from '../types/internalAccountsTypes';

export const getAllAccounts = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseAllAccounts> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/internal-accounts/all-accounts`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getInternalAccountsData = async (payload: UserPayload & getInternalAccounts) => {
    try {
        const resp: SuccessGenericResponse<ApiResponseInternalAccounts> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/internal-accounts`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const addInternalAccounts = async ({
    userId,
    userType,
    ...payload
}: UserPayload & AddInternalAccountsPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.post(
            `${userType}/${userId}/others/internal-accounts`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deleteInternalAccount = async (payload: UserPayload & { accountId: string }) => {
    try {
        const { accountId } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/internal-accounts/${accountId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
