import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { PartnerServiceAccessList } from '../types/partnerServices';

export const getPartnerServiceAccess = async (
    payload: UserPayload & {
        partnerId?: number;
        status?: boolean;
        page?: number;
        itemsPerPage?: number;
        searchText?: string;
    }
) => {
    try {
        const resp: SuccessGenericResponse<PartnerServiceAccessList> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/partnerServiceAccess`,
            {
                params: {
                    partnerId: payload.partnerId,
                    status: payload.status,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const postPartnerServiceAccess = async (
    payload: UserPayload & {
        partnerId: number;
        permissions: any[];
    }
) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/partnerServiceAccess`,
            {
                partnerId: payload.partnerId,
                permissions: payload.permissions,
            }
        );
        return res;
    } catch (err) {
        return false;
    }
};

export const patchPartnerServiceAccessStatus = async (
    payload: UserPayload & {
        id: number;
        status: boolean;
    }
) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/partnerServiceAccess/${payload.id}`,
            { status: payload.status }
        );
        return res;
    } catch (err) {
        return false;
    }
};

export const deletePartnerServiceAccess = async (payload: UserPayload & { id: number }) => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/others/partnerServiceAccess/${payload.id}`
        );
        return res;
    } catch (err) {
        return false;
    }
};
