import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CurrentPlanResponse,
    PackageQueryParams,
    ResponseDataSubscriptionHistory,
    downloadResponse,
} from '../types/subscription';

export const getPurchaseHistory = async ({
    itemsPerPage,
    page,
    status,
    packageType,
}: PackageQueryParams) => {
    try {
        const resp: SuccessGenericResponse<ResponseDataSubscriptionHistory> = await ApiClient.get(
            `user/subscription/purchse-history`,
            {
                params: {
                    page,
                    itemsPerPage,
                    status,
                    packageType,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getCurrentSubscription = async () => {
    try {
        const resp: SuccessGenericResponse<CurrentPlanResponse> = await ApiClient.get(
            `user/subscription/current-details`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const downloadInvoice = async (invoiceId: number, tableName: string) => {
    try {
        const res: SuccessGenericResponse<downloadResponse> = await ApiClient.get(
            `user/subscription/downlaod-invoice/${invoiceId}?type=${tableName}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

// Common transaction-document download (others MS): invoice (when stored on the
// order) or receipt (generated retroactively for orders that predate storage).
export const downloadTransactionDocument = async (
    userType: string,
    userId: number,
    corporateTxnId: string | number,
    type: 'invoice' | 'receipt'
) => {
    try {
        const res: SuccessGenericResponse<downloadResponse> = await ApiClient.get(
            `${userType}/${userId}/others/transactions/download/${corporateTxnId}/${type}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const cancelSubscriptionPatch = async (subscriptionId: number) => {
    try {
        const res: SuccessGenericResponse<{ message: string }> = await ApiClient.patch(
            `user/subscription/cancel-subscription/${subscriptionId}`
        );

        return res;
    } catch (error) {
        return false;
    }
};

export interface LifecycleSettingsResponse {
    gracePeriodDays: number;
    frozenPeriodDays: number;
    payrollDataClearDays: number;
    payrollFreeEmployeeLimit: number | null;
}

export const getLifecycleSettings = async () => {
    try {
        const res: SuccessGenericResponse<LifecycleSettingsResponse> = await ApiClient.get(
            `user/subscription/lifecycle-settings`
        );
        return res.data;
    } catch (error) {
        return false;
    }
};

// An individual package enriched with its cashback pricing (included units + per-unit price), keyed by
// packageId so the settings view can reveal a subscription's unit price + base limit on demand.
export interface IndividualPackagePricing {
    id: number;
    packageName: string;
    unitPrice: string | null;
    baseLimit: string | null;
    serviceAccessKey: string | null;
    isDynamicUnitPricing: boolean | null;
}

export const getIndividualPackagesPricing = async (): Promise<IndividualPackagePricing[]> => {
    try {
        const res: SuccessGenericResponse<{ packages: IndividualPackagePricing[] }> =
            await ApiClient.get(`user/subscription/list-individual-packages`);
        return res.data?.packages ?? [];
    } catch (error) {
        return [];
    }
};
