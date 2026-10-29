import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { Application, ApplicationsListResponse } from '@domains/dashboard/CompanyIncorporation/types';
import { ApiClient } from '@src/services/config';

import { getData } from '../types/index';

export interface AdminDocument {
    docType: string;
    fileName: string;
    mimeType?: string;
    vendorUrl: string;
}

export interface AdminApplication
    extends Omit<Application, 'documents' | 'moaAoa' | 'llpAgreement'> {
    credential?: {
        id: number;
        username: string;
        name: string;
    };
    corporateUser?: {
        id: number;
        name: string;
    };
    incorporationFee?: number;
    additionalServicesFee?: number;
    paymentStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
    documents?: AdminDocument[];
    moaAoa?: {
        moaType?: string;
        aoaType?: string;
        mainObjectTemplate?: string;
        mainObjectCustomText?: string;
        ancillaryObjects?: number[];
        confirmed?: boolean;
    };
    llpAgreement?: {
        agreementType?: string;
        partnerRights?: Record<string, boolean>;
        partnerDuties?: Record<string, boolean>;
        meetingQuorum?: string;
        votingThreshold?: string;
        disputeResolution?: { method: string; jurisdiction: string };
    };
}

export interface AdminApplicationsListResponse
    extends Omit<ApplicationsListResponse, 'applications'> {
    applications: AdminApplication[];
}

export type CIFilters = getData & { entityType?: string };

export const getAllApplications = async (payload: UserPayload & CIFilters) => {
    try {
        const resp: SuccessGenericResponse<AdminApplicationsListResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/applications`,
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
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const getApplicationDetail = async (
    payload: UserPayload & { applicationId: string }
) => {
    try {
        const resp: SuccessGenericResponse<AdminApplication> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/company-incorporation/applications/${payload.applicationId}`
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
