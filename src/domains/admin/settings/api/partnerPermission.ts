import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    activeResponse,
    categoryResponse,
    CashbackItemResponse,
    cashbackResponse,
    categorySearch,
    ClonePartner,
    ClonePermissionPayload,
    ClonePermissionResult,
    CopyIconsResult,
    getPermissionsResp,
    getSystemUsers,
    PartnerItem,
    Role,
    RolesResponse,
    updateClonePartner,
    updateRole,
    updateStatus,
} from '../types/partnerPermission';

export const getRoles = async (payload: UserPayload & getSystemUsers) => {
    try {
        const resp: SuccessGenericResponse<RolesResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/partnerPermission`,
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
export const getCashbackData = async (payload: cashbackResponse) => {
    try {
        const { recordId } = payload;

        const resp: SuccessGenericResponse<CashbackItemResponse> = await ApiClient.get(
            `/user/services/corporateCheckCashBack`,
            {
                params: {
                    partnerId: recordId,
                },
            }
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};
export const createRoles = async (payload: UserPayload & updateRole) => {
    try {
        delete payload.id;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/partnerPermission`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};
// GET /:userType/:userId/others/partnerPermission/:id — single-record fetch backing
// `router.get('/:id', findOnePartnerPermission)`. Used when opening the edit modal so
// it works off the freshest full record rather than whatever the paginated list held.
export const getRoleById = async (payload: UserPayload & { id: number | string }) => {
    try {
        const { id } = payload;
        const resp: SuccessGenericResponse<Role> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/partnerPermission/${id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const updateRoles = async (payload: UserPayload & updateRole) => {
    try {
        const { id } = payload;
        delete payload.id;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.put(
            `${payload.userType}/${payload.userId}/others/partnerPermission/${id}`,
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
            `${payload.userType}/${payload.userId}/others/partnerPermission/${payload.type}`,
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

export const putUpdateRolesStatus = async (payload: UserPayload & updateStatus) => {
    try {
        const { id } = payload;
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.patch(
            `${payload.userType}/${payload.userId}/others/partnerPermission/updateStatus/${id}`,
            { status: payload.status }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getpartner = async (payload: UserPayload & categorySearch) => {
    try {
        const resp: SuccessGenericResponse<categoryResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/users/fetch-partner?q=${payload.searchText}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPermissionsApi = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<getPermissionsResp> = await ApiClient.get(
            `user/services/partner-initial-sidebar`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const createClone = async (payload: UserPayload & updateClonePartner) => {
    try {
        const resp: SuccessGenericResponse<activeResponse> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/partner/clonePartner`,
            payload
        );
        return resp;
    } catch (err) {
        return false;
    }
};
export const postClonePartnerPermission = async (payload: UserPayload & ClonePermissionPayload) => {
    try {
        const resp: SuccessGenericResponse<ClonePermissionResult> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/partnerPermission/clone`,
            { fromPartnerId: payload.fromPartnerId, toPartnerId: payload.toPartnerId }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const postCopyPartnerPermissionIcons = async (
    payload: UserPayload & ClonePermissionPayload
) => {
    try {
        const resp: SuccessGenericResponse<CopyIconsResult> = await ApiClient.post(
            `${payload.userType}/${payload.userId}/others/partnerPermission/copy-icons`,
            { fromPartnerId: payload.fromPartnerId, toPartnerId: payload.toPartnerId }
        );
        return resp;
    } catch (err) {
        return false;
    }
};

export const getClonePartnerFrom = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<ClonePartner> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/partner/clonePartnerFrom`
        );
        const { data } = resp;

        return data;
    } catch (err) {
        return false;
    }
};

export const getClonePartnerTo = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<PartnerItem> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/partner/clonePartnerTo`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
