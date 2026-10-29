import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

export interface GovernmentServiceApplicationPayload extends UserPayload {
    accessKey: string;
    formData: Record<string, unknown>;
    applicationId?: number | null;
    status?: string;
}

export interface GovernmentServiceApplicationResponse {
    applicationId: string;
    status: string;
}

export interface ApplicationDraft {
    id: number;
    applicationNumber: string;
    currentStep: number;
    status: string;
    formData: Record<string, Record<string, string>>;
    approvedDocument: string | null;
}

export const submitGovernmentServiceApplicationApi = async (
    payload: GovernmentServiceApplicationPayload
) => {
    try {
        const { userId, userType, accessKey, formData, applicationId, status } = payload;
        const resp: SuccessGenericResponse<GovernmentServiceApplicationResponse> =
            await ApiClient.post(
                `${userType}/${userId}/purchase/govt-services/applications`,
                {
                    accessKey,
                    formData,
                    ...(applicationId ? { applicationId } : {}),
                    ...(status ? { status } : {}),
                }
            );
        return resp.data;
    } catch {
        return false;
    }
};

export interface ApplicationListItem {
    id: number;
    applicationNumber: string;
    service: string;
    status: string;
    currentStep: number;
    adminNotes: string | null;
    remarks: string | null;
    approvedDocument: string | null;
    createdAt: string;
    updatedAt: string;
}

export const getAllGovernmentServiceApplicationsApi = async (
    userId: string | number,
    userType: string
): Promise<ApplicationListItem[]> => {
    try {
        const resp: SuccessGenericResponse<ApplicationListItem[]> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/applications`
        );
        return resp.data ?? [];
    } catch {
        return [];
    }
};

export interface GovtServiceApiItem {
    id: number;
    name: string;
    slug: string;
    accessKey: string;
    description: string | null;
    category: string;
    tag: 'Mandatory' | 'Regulatory Dependent' | 'Good-to-have';
    processingTime: string | null;
    price: string | number;
    govtFee: string | number | null;
    status: boolean | number;
    sortOrder: number;
}

export const getGovtServicesListApi = async (
    userId: string | number,
    userType: string,
    params?: {
        searchText?: string;
        category?: string;
        tag?: string;
        authority?: string;
    }
): Promise<GovtServiceApiItem[]> => {
    try {
        const resp: SuccessGenericResponse<GovtServiceApiItem[]> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/services`,
            { params }
        );
        return resp.data ?? [];
    } catch {
        return [];
    }
};

export const getGovernmentServiceApplicationByIdApi = async (
    userId: string | number,
    userType: string,
    applicationId: number | string
): Promise<ApplicationDraft | null> => {
    try {
        const resp: SuccessGenericResponse<ApplicationDraft | null> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/applications/${applicationId}`
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

export const downloadGovernmentServiceDocumentApi = async (
    userId: string | number,
    userType: string,
    url: string
) => {
    try {
        const resp = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/applications/download`,
            { params: { url } }
        );
        return resp.data as { buffer: { type: string; data: number[] }; fileType: string };
    } catch {
        return false;
    }
};

export const getGovtServiceByAccessKeyApi = async (
    userId: string | number,
    userType: string,
    accessKey: string
): Promise<GovtServiceApiItem | null> => {
    try {
        const resp: SuccessGenericResponse<GovtServiceApiItem> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/services/${accessKey}`
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};

export const getDynamicFieldOptionsApi = async (
    userId: string | number,
    userType: string,
    endpoint: string,
    queryParam: string,
    queryValue: string
): Promise<string[]> => {
    try {
        const resp: SuccessGenericResponse<string[]> = await ApiClient.get(
            `${userType}/${userId}/${endpoint}`,
            { params: { [queryParam]: queryValue } }
        );
        return resp.data ?? [];
    } catch {
        return [];
    }
};

export const getCountriesListApi = async (
    userId: string | number,
    userType: string
): Promise<string[]> => {
    try {
        const resp: SuccessGenericResponse<{ name: string; code: string }[]> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/countries`
        );
        return (resp.data ?? []).map(c => c.name);
    } catch {
        return [];
    }
};

export const getPanBusinessCodesApi = async (
    userId: string | number,
    userType: string
): Promise<string[]> => {
    try {
        const resp: SuccessGenericResponse<{ businessCode: string; natureOfBusiness: string }[]> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/pan-business-codes`
        );
        return (resp.data ?? []).map(c => `${c.businessCode} — ${c.natureOfBusiness}`);
    } catch {
        return [];
    }
};

export const getGovernmentServiceApplicationApi = async (
    userId: string | number,
    userType: string,
    accessKey: string
): Promise<ApplicationDraft | null> => {
    try {
        const resp: SuccessGenericResponse<ApplicationDraft | null> = await ApiClient.get(
            `${userType}/${userId}/purchase/govt-services/applications/drafts`,
            { params: { accessKey } }
        );
        return resp.data ?? null;
    } catch {
        return null;
    }
};
