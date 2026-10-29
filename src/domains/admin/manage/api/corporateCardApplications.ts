import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import {
    ApplicationMutationResult,
    ApplicationsListPayload,
    ApplicationsListResponse,
    ApplicationsSummary,
    CorporateCardApplicationDetail,
    CorporateOption,
    UpdateApplicationPayload,
} from '../types/corporateCardApplications';

const base = (userType: string, userId: number) =>
    `${userType}/${userId}/corporate-cards/applications`;

// Global overview counts for the dashboard strip (independent of the current list filter/page).
export const getCorporateCardApplicationsSummary = async (userType: string, userId: number) => {
    try {
        const resp: SuccessGenericResponse<{ summary: ApplicationsSummary }> = await ApiClient.get(
            `${base(userType, userId)}/summary`
        );
        return resp.data.summary;
    } catch {
        return false;
    }
};

export const getCorporateCardApplications = async (
    payload: UserPayload & ApplicationsListPayload
) => {
    try {
        const resp: SuccessGenericResponse<ApplicationsListResponse> = await ApiClient.get(
            base(payload.userType, payload.userId),
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    ...(payload.searchText ? { searchText: payload.searchText } : {}),
                    ...(payload.status ? { status: payload.status } : {}),
                },
            }
        );
        // Backend returns { count, rows }; adapt to the table's { data, recordsTotal } shape.
        return { data: resp.data.rows, recordsTotal: resp.data.count };
    } catch {
        return false;
    }
};

// Corporates without an application yet — for the "Add application" picker (typeahead).
export const getCorporatesForApplication = async (
    userType: string,
    userId: number,
    searchText?: string
) => {
    try {
        const resp: SuccessGenericResponse<{ corporates: CorporateOption[] }> = await ApiClient.get(
            `${userType}/${userId}/corporate-cards/corporates`,
            { params: searchText ? { searchText } : {} }
        );
        return resp.data.corporates;
    } catch {
        return false;
    }
};

export const getCorporateCardApplication = async (
    userType: string,
    userId: number,
    corporateId: number
) => {
    try {
        const resp: SuccessGenericResponse<{ application: CorporateCardApplicationDetail | null }> =
            await ApiClient.get(`${base(userType, userId)}/${corporateId}`);
        return resp.data.application;
    } catch {
        return false;
    }
};

export const updateCorporateCardApplication = async (
    userType: string,
    userId: number,
    corporateId: number,
    payload: UpdateApplicationPayload
) => {
    try {
        const resp: SuccessGenericResponse<ApplicationMutationResult> = await ApiClient.put(
            `${base(userType, userId)}/${corporateId}`,
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const retryVendorKybEmail = async (
    userType: string,
    userId: number,
    corporateId: number
) => {
    try {
        const resp: SuccessGenericResponse<ApplicationMutationResult> = await ApiClient.post(
            `${base(userType, userId)}/${corporateId}/vendor-email/retry`,
            {}
        );
        return resp.data;
    } catch {
        return false;
    }
};
