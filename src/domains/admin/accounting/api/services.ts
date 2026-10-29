import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { newCashback, ServiceData } from '@src/domains/admin/settings/types/cashback';
import { ApiClient } from '@src/services/config';

import {
    AccountingPlanType,
    AccountingService,
    AccountingServiceAddOnsResponse,
    AccountingServiceCommissionModesResponse,
    AccountingServiceFilters,
    AccountingServiceListResponse,
    AccountingServicePlansFilters,
    AccountingServicePlansResponse,
    ServicesTypeConfig,
    SplitCommission,
} from '../types/services';

type UpdateCommissionPayload = UserPayload & {
    id: number;
    commissionMode: string;
    commissionType: string;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
};

type UpdateCommissionStatusPayload = UserPayload & {
    id: number;
    isCommissionConfigured: boolean;
};

type UpdateVendorPayload = UserPayload & {
    id: number;
    vendorName: string;
    state: string;
    gstNo: string;
    address: string;
    vendorEmail: string[];
};

type UpdatePlanCommissionPayload = UserPayload & {
    accessKey: string;
    planId: number;
    price?: number;
    annualPrice?: number;
    discount?: number;
    annualDiscount?: number;
    commissionMode: string;
    commissionType: string;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
    splitCommission?: SplitCommission | null;
};

type UpdateAddOnPayload = UserPayload & {
    accessKey: string;
    addOnType: string;
    price: number;
    commissionMode: string;
    commissionType: string;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
};

type UpdatePlanCommissionBulkPayload = UserPayload & {
    accessKey: string;
    planIds: number[];
    commissionMode: string;
    commissionType: string;
    providerCommission: number;
    fixedCommissionPerTransaction: number;
    isCommissionInclGST: boolean;
    splitCommission?: SplitCommission | null;
};

type UpdatePlanCommissionStatusPayload = UserPayload & {
    accessKey: string;
    planId: number;
    isCommissionConfigured: boolean;
};

type UpdateCashbackBulkPayload = UserPayload & {
    ids: number[];
    cashbackType?: string;
    cashback?: string | number;
    surchargeType?: string;
    surcharge?: string | number;
    unitPrice?: string | number;
    baseLimit?: string | number;
};

type UpdateCashbackStatusPayload = UserPayload & {
    id: number;
    isSurchargeConfigured: boolean;
};

const base = ({ userType, userId }: UserPayload) => `${userType}/${userId}/others/accounting`;

export const getAccountingServices = async (
    payload: UserPayload & { type: AccountingPlanType } & AccountingServiceFilters
) => {
    try {
        const { userId, userType, type, ...filters } = payload;
        const resp: SuccessGenericResponse<AccountingServiceListResponse> = await ApiClient.get(
            `${base({ userId, userType })}/services`,
            { params: { type, ...filters } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getAccountingService = async (payload: UserPayload & { accessKey: string }) => {
    try {
        const resp: SuccessGenericResponse<AccountingService> = await ApiClient.get(
            `${base(payload)}/services/${encodeURIComponent(payload.accessKey)}`,
            { skipErrorToast: true }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServiceCommission = async (payload: UpdateCommissionPayload) => {
    try {
        const { userId, userType, id, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.put(
            `${base({ userId, userType })}/services/commission/${id}`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServiceCommissionStatus = async (
    payload: UpdateCommissionStatusPayload
) => {
    try {
        const { userId, userType, id, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.patch(
            `${base({ userId, userType })}/services/commission-status/${id}`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServiceVendor = async (payload: UpdateVendorPayload) => {
    try {
        const { userId, userType, id, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.put(
            `${base({ userId, userType })}/services/vendor/${id}`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getAccountingServicePlans = async (
    payload: UserPayload & { accessKey: string } & AccountingServicePlansFilters
) => {
    try {
        const { userId, userType, accessKey, ...filters } = payload;
        const resp: SuccessGenericResponse<AccountingServicePlansResponse> = await ApiClient.get(
            `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/plans`,
            { params: filters }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServicePlanCommission = async (
    payload: UpdatePlanCommissionPayload
) => {
    try {
        const { userId, userType, accessKey, planId, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.put(
            `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/plans/${planId}`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getAccountingServiceCommissionModes = async (
    payload: UserPayload & { accessKey: string }
) => {
    try {
        const { userId, userType, accessKey } = payload;
        const resp: SuccessGenericResponse<AccountingServiceCommissionModesResponse> =
            await ApiClient.get(
                `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/commission-modes`
            );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getAccountingServiceAddOns = async (payload: UserPayload & { accessKey: string }) => {
    try {
        const { userId, userType, accessKey } = payload;
        const resp: SuccessGenericResponse<AccountingServiceAddOnsResponse> = await ApiClient.get(
            `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/add-ons`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServiceAddOn = async (payload: UpdateAddOnPayload) => {
    try {
        const { userId, userType, accessKey, addOnType, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.put(
            `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/add-ons/${encodeURIComponent(addOnType)}`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServiceAddOnCommissionStatus = async (
    payload: UserPayload & {
        accessKey: string;
        addOnType: string;
        isCommissionConfigured: boolean;
    }
) => {
    try {
        const { userId, userType, accessKey, addOnType, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.patch(
            `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/add-ons/${encodeURIComponent(addOnType)}/commission-status`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServicePlanCommissionBulk = async (
    payload: UpdatePlanCommissionBulkPayload
) => {
    try {
        const { userId, userType, accessKey, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.put(
            `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/plans/bulk-commission`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServicePlanCommissionStatus = async (
    payload: UpdatePlanCommissionStatusPayload
) => {
    try {
        const { userId, userType, accessKey, planId, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.patch(
            `${base({ userId, userType })}/services/${encodeURIComponent(accessKey)}/plans/${planId}/commission-status`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServiceCashbackBulk = async (payload: UpdateCashbackBulkPayload) => {
    try {
        const { userId, userType, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.put(
            `${base({ userId, userType })}/cashbacks/bulk`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingServiceCashbackStatus = async (
    payload: UpdateCashbackStatusPayload
) => {
    try {
        const { userId, userType, id, ...data } = payload;
        const resp: SuccessGenericResponse<Record<string, never>> = await ApiClient.patch(
            `${base({ userId, userType })}/cashbacks/${id}/surcharge-status`,
            data
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getServicesTypeConfig = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ServicesTypeConfig> = await ApiClient.get(
            `${base(payload)}/services-type-config`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const createAccountingCashbackApi = async ({
    userId,
    userType,
    ...payload
}: UserPayload & newCashback) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<ServiceData> = await ApiClient.post(
            `${base({ userId, userType })}/cashbacks`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const updateAccountingCashbackApi = async ({
    userId,
    userType,
    id,
    ...payload
}: UserPayload & newCashback) => {
    try {
        const resp: SuccessGenericResponse<ServiceData> = await ApiClient.put(
            `${base({ userId, userType })}/cashbacks/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};
