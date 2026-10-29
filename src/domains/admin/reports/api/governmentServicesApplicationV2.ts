import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';

// Admin "Govt Services Applications" report for Gov Services V2 (vendor catalog, e.g. Trademark Registration).
export interface GSV2AdminApplication {
    id: number;
    // Vendor's business application_id — not unique on this table; admin actions are keyed by the row's own id instead.
    applicationId: string | null;
    vendorCatalogId: string | null;
    serviceId: number | null;
    serviceName: string | null;
    variantName: string | null;
    legalBusinessName: string | null;
    pan: string | null;
    phoneNumber: string | null;
    stateOfRegistration: string | null;
    amount: number | string;
    status: 'DRAFT' | 'SUBMITTED' | 'COMPLETED';
    paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
    corporateTxnId: string | null;
    paidAt: string | null;
    vendorGid: string | null;
    vendorEngagementId: string | null;
    rejectionReason: string | null;
    notes: string | null;
    submittedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    credentialId: number;
    credential?: { id: number; username: string; name: string };
    // Only present on the single-record detail fetch — the list query excludes these large JSON columns (they blow MySQL's sort buffer on ORDER BY).
    applicationData?: Record<string, unknown>;
    documents?: unknown;
}

export interface GSV2AdminListResponse {
    applications: GSV2AdminApplication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type GSV2Filters = getData & { paymentStatus?: string };

export const getAllApplications = async (payload: UserPayload & GSV2Filters) => {
    try {
        const resp: SuccessGenericResponse<GSV2AdminListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/govt-services-v2/applications`,
            {
                params: {
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText || undefined,
                    from: payload.from,
                    to: payload.to,
                    corporateId: payload.id || undefined,
                    sort: payload.sort,
                    sortField: payload.sortField,
                    status: payload.status || undefined,
                    paymentStatus: payload.paymentStatus || undefined,
                },
            }
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getApplicationDetail = async (payload: UserPayload & { id: number | string }) => {
    try {
        const resp: SuccessGenericResponse<GSV2AdminApplication> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/purchase/govt-services-v2/applications/${payload.id}`
        );
        return resp.data;
    } catch {
        return false;
    }
};
