import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    GovtServiceData,
    GovtServiceFilters,
    GovtServiceUpdatePayload,
    GovtServiceUpdateStatus,
} from '../types/govtServicesTypes';

const base = (payload: UserPayload) =>
    `${payload.userType}/${payload.userId}/purchase/govt-services`;

export const getAllGovtServices = async (payload: UserPayload & GovtServiceFilters) => {
    try {
        const resp: SuccessGenericResponse<GovtServiceData> = await ApiClient.get(base(payload), {
            params: {
                page: payload.page,
                itemsPerPage: payload.itemsPerPage,
                searchText: payload.searchText,
                sort: payload.sort,
                sortField: payload.sortField,
            },
        });
        return resp.data;
    } catch {
        return false;
    }
};

export interface GovtServicesSyncResult {
    created: number;
    updated: number;
    // Rows that were active but the vendor no longer returned this sync —
    // disabled rather than left stale.
    disabled: number;
    total: number;
    // Exact, uncompressed vendor catalog payload the sync pulled — shape is
    // whatever the vendor sends, not reshaped on the backend.
    vendorCatalog: unknown[];
}

// Returns the full response, not just resp.data — the backend's own message
// ("Catalog synced: X added, Y updated") is what the FE should show, not a
// generic hardcoded string.
export const syncGovtServicesCatalog = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<GovtServicesSyncResult> = await ApiClient.post(
            `${base(payload)}/sync`,
            {}
        );
        return resp;
    } catch {
        return false;
    }
};

export const updateGovtService = async (payload: UserPayload & GovtServiceUpdatePayload) => {
    try {
        const {
            id,
            amount,
            status,
            sortOrder,
            commissionMode,
            commissionType,
            commission,
            fixedCommissionPerTransaction,
            isCommissionInclGST,
        } = payload;
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(`${base(payload)}/${id}`, {
            amount,
            status,
            sortOrder,
            commissionMode,
            commissionType,
            commission,
            fixedCommissionPerTransaction,
            isCommissionInclGST,
        });
        return resp.data;
    } catch {
        return false;
    }
};

export const updateGovtServiceStatus = async (payload: UserPayload & GovtServiceUpdateStatus) => {
    try {
        const resp: SuccessGenericResponse<{}> = await ApiClient.put(
            `${base(payload)}/status/${payload.id}`,
            { status: payload.status }
        );
        return resp.data;
    } catch {
        return false;
    }
};
