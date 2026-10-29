import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ChartofAccount,
    ChartofAccountData,
    getChartOfAccounts,
    newChartofAccount,
} from '../types/chartofAccount';
import { COArules, newCoaRules, updateStatusRule } from '../types/coaRules';

export const getAllChartofAccounts = async (payload: UserPayload & getChartOfAccounts) => {
    try {
        const resp: SuccessGenericResponse<ChartofAccountData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/chart-of-accounts`,
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

export const addChartOfAccount = async (payload: UserPayload & newChartofAccount) => {
    try {
        const reqbody = {
            account_name: payload.accountName,
            account_type: payload.accountType,
            account_code: payload.accountCode,
            description: payload.description,
            parent_account_id: payload.parentAccId,
        };
        const resp: SuccessGenericResponse<ChartofAccount> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/chart-of-accounts`,
            reqbody
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateChartOfAccount = async ({
    userId,
    userType,
    ...payload
}: UserPayload & newChartofAccount) => {
    try {
        const { id } = payload;
        const reqbody = {
            account_name: payload.accountName,
            account_type: payload.accountType,
            account_code: payload.accountCode,
            description: payload.description,
            parent_account_id: payload.parentAccId,
        };
        delete payload.id;
        const resp: SuccessGenericResponse<ChartofAccount> = await ApiClient.put(
            `${userType}/${userId}/others/chart-of-accounts/${id}`,
            reqbody
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getallaccountTypes = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ChartofAccount> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/chart-of-accounts/account-types`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getAllRules = async (payload: UserPayload & getChartOfAccounts) => {
    try {
        const resp: SuccessGenericResponse<ChartofAccountData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/coa-rules`,
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

export const addRules = async (payload: UserPayload & newCoaRules) => {
    try {
        const reqbody = {
            prefix: payload.prefix,
            accountType: payload.accountType,
            parentAccountId: payload?.parentAccId || null,
            entityType: payload.entityType,
            description: payload.description,
        };
        const resp: SuccessGenericResponse<COArules> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/coa-rules`,
            reqbody
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateRules = async ({ userId, userType, ...payload }: UserPayload & newCoaRules) => {
    try {
        const { id } = payload;
        const reqbody = {
            accountType: payload.accountType,
            entityType: payload.entityType,
            parentAccountId: payload?.parentAccId || null,
            description: payload.description,
        };
        delete payload.id;
        const resp: SuccessGenericResponse<COArules> = await ApiClient.put(
            `${userType}/${userId}/others/coa-rules/${id}`,
            reqbody
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const updateRuleStatus = async ({
    userId,
    userType,
    ...payload
}: UserPayload & updateStatusRule) => {
    try {
        const { ruleId } = payload;
        delete payload.ruleId;
        const resp: SuccessGenericResponse<ChartofAccount> = await ApiClient.patch(
            `${userType}/${userId}/others/coa-rules/status/${ruleId}`,
            payload
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getallParents = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/chart-of-accounts/parent-accounts`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
