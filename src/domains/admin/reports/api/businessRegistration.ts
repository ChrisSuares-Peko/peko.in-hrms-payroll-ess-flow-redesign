import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';

export interface BRPerson {
    pan?: string;
    din?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    mobile?: string;
    nationality?: string;
    dob?: string;
}

export interface BRDocument {
    docType: string;
    personKey?: string | null;
    fileName: string;
    vendorUrl?: string;
}

export interface BRVendorStage {
    status: 'done' | 'failed' | 'skipped';
    at?: string;
    error?: string;
    // Stage-specific detail — e.g. the documents stage stores per-document
    // upload results ({ results: [{ docType, status, reason }] }).
    meta?: unknown;
}

export interface BRAdminApplication {
    applicationId: string;
    entityType: string;
    businessName?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactMobile?: string;
    incorporationFee?: number;
    gstAmount?: number;
    totalAmount?: number;
    status: string;
    paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
    corporateTxnId?: string;
    paidAt?: string;
    vendorStatus?: string;
    // IndiaFilings' startup application id (from /add-startup) — distinct from
    // OUR applicationId (BR/{year}/{n}).
    vendorApplicationId?: string | null;
    vendorEngagementId?: string;
    vendorError?: string;
    srn?: string;
    rejectionReason?: string;
    createdAt: string;
    // Final-submit stamp — createdAt is the draft-creation date.
    submittedAt?: string | null;
    applicationData?: Record<string, unknown>;
    documents?: BRDocument[];
    vendorStages?: Record<string, BRVendorStage>;
    credential?: { id: number; username: string; name: string };
    corporateUser?: { id: number; name: string };
}

export interface BRAdminListResponse {
    applications: BRAdminApplication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type BRFilters = getData & { entityType?: string; paymentStatus?: string };

export const getAllApplications = async (payload: UserPayload & BRFilters) => {
    try {
        const resp: SuccessGenericResponse<BRAdminListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/business-registration/applications`,
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
                    entityType: payload.entityType || undefined,
                    paymentStatus: payload.paymentStatus || undefined,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const retryVendorSync = async (
    payload: UserPayload & { applicationId: string; forceSmartForm2?: boolean }
) => {
    try {
        await ApiClient.post(
            `${payload.userType}/${payload.userId}/officeAndBusiness/business-registration/applications/${payload.applicationId}/send-to-vendor`,
            // forceSmartForm2: file Smart Form 2 even without documents (RM collects them).
            payload.forceSmartForm2 ? { forceSmartForm2: true } : {}
        );
        return true;
    } catch (err) {
        return false;
    }
};

export const getApplicationDetail = async (payload: UserPayload & { applicationId: string }) => {
    try {
        const resp: SuccessGenericResponse<BRAdminApplication> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/business-registration/applications/${payload.applicationId}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
