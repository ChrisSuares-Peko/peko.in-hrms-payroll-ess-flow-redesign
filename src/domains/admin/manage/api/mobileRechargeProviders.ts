import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    activeResponse,
    createMobileRechargeProviderPayload,
    deleteMobileRechargeProviderPayload,
    getMobileRechargeProvidersPayload,
    MobileRechargeProviderData,
    MobileRechargeProviderResponse,
    updateMobileRechargeProviderPayload,
    updateMobileRechargeProviderStatusPayload,
} from '../types/mobileRechargeProviderTypes';

/**
 * Fetch all mobile recharge providers.
 */
export const getAllMobileRechargeProviders = async (
    payload: UserPayload & getMobileRechargeProvidersPayload
) => {
    try {
        const resp: SuccessGenericResponse<MobileRechargeProviderResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/mobile-recharge-providers`,
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

/**
 * Delete a mobile recharge provider.
 */
export const deleteMobileRechargeProvider = async (
    payload: deleteMobileRechargeProviderPayload
): Promise<activeResponse | false> => {
    try {
        const resp: activeResponse = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/mobile-recharge-providers/${payload.providerId}`
        );
        return resp;
    } catch (err) {
        return false;
    }
};

/**
 * Create a new mobile recharge provider.
 */
export const createMobileRechargeProvider = async (
    payload: createMobileRechargeProviderPayload & UserPayload
): Promise<SuccessGenericResponse<MobileRechargeProviderData> | false> => {
    try {
        const resp: SuccessGenericResponse<MobileRechargeProviderData> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/mobile-recharge-providers`,
            {
                providerName: payload.providerName,
                displayName: payload.displayName,
                commissionMode: payload.commissionMode,
                commissionType: payload.commissionType,
                commission: payload.commission,
                fixedCommissionPerTransaction: payload.fixedCommissionPerTransaction,
                isCommissionInclGST: payload.isCommissionInclGST,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

/**
 * Update an existing mobile recharge provider.
 */
export const updateMobileRechargeProvider = async (
    payload: updateMobileRechargeProviderPayload & UserPayload
): Promise<SuccessGenericResponse<MobileRechargeProviderData> | false> => {
    try {
        const resp: SuccessGenericResponse<MobileRechargeProviderData> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/mobile-recharge-providers/${payload.id}`,
            {
                providerName: payload.providerName,
                displayName: payload.displayName,
                commissionMode: payload.commissionMode,
                commissionType: payload.commissionType,
                commission: payload.commission,
                fixedCommissionPerTransaction: payload.fixedCommissionPerTransaction,
                isCommissionInclGST: payload.isCommissionInclGST,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

/**
 * Toggle a mobile recharge provider's active status.
 */
export const updateMobileRechargeProviderStatus = async (
    payload: updateMobileRechargeProviderStatusPayload
): Promise<activeResponse | false> => {
    try {
        const resp: activeResponse = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/mobile-recharge-providers/update-status/${payload.id}`,
            {
                status: payload.status,
            }
        );
        return resp;
    } catch (err) {
        return false;
    }
};
