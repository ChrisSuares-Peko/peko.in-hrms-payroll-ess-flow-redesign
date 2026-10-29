import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { CommonPayload } from '../types';
import { SetupTenantPayload, TenantStatsResponse } from '../types/tenant';

export type SetupTenantResult =
    | { ok: true; data: unknown }
    | { ok: false; status: number; message: string };

export const setupTenant = async (
    payload: CommonPayload & SetupTenantPayload
): Promise<SetupTenantResult> => {
    const { userId, userType, ...body } = payload;
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/ecommerce/tenant`,
            body
        );
        return { ok: true, data: resp.data };
    } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status ?? 500;
        const message =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Could not configure store. Please try again.';
        return { ok: false, status, message };
    }
};

export const getTenantStats = async (
    payload: CommonPayload
): Promise<TenantStatsResponse | null | false> => {
    try {
        const resp: SuccessGenericResponse<TenantStatsResponse | null> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/ecommerce/tenant/stats`
        );
        return resp.data ?? null;
    } catch (err) {
        return false;
    }
};
