import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { SavedAddressPayload, SavedAddressResponse } from '../types/address';

export const getSavedAddressApi = async (payload: SavedAddressPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<SavedAddressResponse> = await ApiClient.get(
            `${userType}/${userId}/purchase/ecommerce/ondc/addressDetails`
        );
        const { data } = resp;
        return data;
    } catch (err: any) {
        // Callers can only see `false`, which is indistinguishable from "no saved
        // addresses" — log the real reason so a failed load is diagnosable.
        const msg = err?.response?.data?.message || err?.message || 'Failed to load addresses';
        console.error('[getSavedAddressApi]', msg, err);
        return false;
    }
};

export type AddSavedAddressPayload = {
    userId: number;
    userType: string;
    name: string;
    addressLine1: string;
    phoneNumber: string;
    zipCode?: string;
    nickname?: string;
};

/** Saves a freshly-typed checkout address for reuse next time. */
export const addSavedAddressApi = async (
    payload: AddSavedAddressPayload
): Promise<true | string> => {
    try {
        const { userId, userType, ...body } = payload;
        await ApiClient.post(`${userType}/${userId}/purchase/ecommerce/ondc/address`, body);
        return true;
    } catch (err: any) {
        const msg =
            err?.response?.data?.message || err?.message || 'Failed to save address';
        console.error('[addSavedAddressApi]', msg, err);
        return msg;
    }
};
