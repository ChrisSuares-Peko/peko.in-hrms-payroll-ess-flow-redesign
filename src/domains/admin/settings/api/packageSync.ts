import { AxiosError } from 'axios';

import { ErrorGenericResponse, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    SyncApplyPayload,
    SyncApplyResult,
    SyncPreview,
    SyncPreviewPayload,
    SyncPreviewResult,
    SyncProvider,
} from '../types/packageSync';

export const getSyncProviders = async ({ userId, userType }: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<{ providers: SyncProvider[] }> = await ApiClient.get(
            `${userType}/${userId}/others/package/sync/providers`
        );
        return resp.data.providers;
    } catch (err) {
        return false;
    }
};

export const getSyncPreview = async ({
    userId,
    userType,
    ...payload
}: SyncPreviewPayload): Promise<SyncPreviewResult> => {
    try {
        const resp: SuccessGenericResponse<SyncPreview> = await ApiClient.post(
            `${userType}/${userId}/others/package/sync/preview`,
            payload
        );
        return { ok: true, data: resp.data };
    } catch (err) {
        const message = (err as AxiosError<ErrorGenericResponse>).response?.data?.message;
        return { ok: false, message: message || 'Could not reach the vendor. Please try again.' };
    }
};

export const applySync = async ({ userId, userType, ...payload }: SyncApplyPayload) => {
    try {
        const resp: SuccessGenericResponse<SyncApplyResult> = await ApiClient.post(
            `${userType}/${userId}/others/package/sync/apply`,
            payload
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
