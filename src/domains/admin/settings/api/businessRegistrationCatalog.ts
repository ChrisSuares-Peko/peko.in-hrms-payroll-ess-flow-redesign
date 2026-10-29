import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    CatalogGetParams,
    CatalogListResponse,
    CatalogStatusPayload,
    CatalogUpdatePayload,
} from '../types/businessRegistrationCatalog';

const base = (payload: UserPayload) =>
    `${payload.userType}/${payload.userId}/officeAndBusiness/business-registration-catalog`;

export const getCatalogData = async (payload: UserPayload & CatalogGetParams) => {
    try {
        const resp: SuccessGenericResponse<CatalogListResponse> = await ApiClient.get(base(payload), {
            params: {
                page: payload.page,
                searchText: payload.searchText,
                itemsPerPage: payload.itemsPerPage,
                sort: payload.sort,
                sortField: payload.sortField,
            },
        });
        return resp.data;
    } catch {
        return false;
    }
};

export const syncCatalog = async (payload: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<unknown> = await ApiClient.post(`${base(payload)}/sync`, {});
        return resp.data;
    } catch {
        return false;
    }
};

export const putUpdateCatalog = async (payload: UserPayload & CatalogUpdatePayload) => {
    try {
        const {
            id, amount, status, sortOrder,
            commissionMode, commissionType, commission, fixedCommissionPerTransaction, isCommissionInclGST,
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

export const updateCatalogStatus = async (payload: UserPayload & CatalogStatusPayload) => {
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
