import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    GetSettingsResponse,
    IndianStatesResponse,
    InvoiceAddressItem,
    InvoiceProfileData,
    SaveSettingsPayload,
} from '../types/settings';

export const getSettingsApi = async (payload: UserPayload) => {
    try {
        const { userId, userType } = payload;
        const resp: SuccessGenericResponse<GetSettingsResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/settings`
        );
        return resp;
    } catch {
        return false;
    }
};

export const saveSettingsApi = async (payload: UserPayload & SaveSettingsPayload) => {
    try {
        const { userId, userType, ...body } = payload;
        const resp: SuccessGenericResponse<GetSettingsResponse> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/invoicing/v2/settings`,
            body
        );
        return resp;
    } catch {
        return false;
    }
};

export const getProfileCompanyApi = async (
    payload: UserPayload
): Promise<InvoiceProfileData | null> => {
    try {
        const resp: SuccessGenericResponse<InvoiceProfileData> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/profile/company`
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

export const getProfileAddressesApi = async (
    payload: UserPayload
): Promise<InvoiceAddressItem[]> => {
    try {
        const resp: SuccessGenericResponse<{ addressDetails: InvoiceAddressItem[] }> =
            await ApiClient.get(
                `${payload.userType}/${payload.userId}/others/profile/addressDetails`
            );
        return resp.data?.addressDetails ?? [];
    } catch {
        return [];
    }
};

export const getIndianStatesApi = async () => {
    try {
        const resp: SuccessGenericResponse<IndianStatesResponse> = await ApiClient.get(
            'user/general/indian-states'
        );
        return resp.data?.states ?? [];
    } catch {
        return [];
    }
};
