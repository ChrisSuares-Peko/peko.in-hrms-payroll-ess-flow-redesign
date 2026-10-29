import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    activeResponse,
    getSystemUsers,
    RolesResponse,
    updateRole,
    updateStatus,
} from '../types/partnerPermission';

export const getRoles = async (payload: UserPayload & getSystemUsers) => {
    try {
        const resp: SuccessGenericResponse<RolesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/branding`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    sort: payload.sort,
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

export const updateBrandingData = async (payload: UserPayload & updateRole) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/branding/${id}`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getFileBufferReportRoles = async (payload: UserPayload & getSystemUsers) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/branding/${payload.type}`,
            {
                params: {
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

export const putUpdateBrandingStatus = async (payload: UserPayload & updateStatus) => {
    try {
        const { id } = payload;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/branding/updateStatus/${id}`,
            { status: payload.status }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
