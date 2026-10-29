import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { PackagesData } from '../types';
import { Country, getData } from '../types/globalBusinessSetup';
import { PricingType } from '../types/pricing';

export const getAllData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/applications`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    // sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPendingData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/applications/drafts`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                    // sortField: payload.sortField,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getOngoingData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/applications/ongoing`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getRenewalData = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/renewals`,
            {
                params: {
                    sort: payload.sort,
                    page: payload.page,
                    searchText: payload.searchText,
                    itemsPerPage: payload.itemsPerPage,
                    to: payload.to,
                    from: payload.from,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getRenewalDetail = async (payload: UserPayload & { id: string }) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/renewals/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getApplicationDetails = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/applications/${payload.id}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getCountries = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<{ countries: Country[] }> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/countries`,
            {
                params: payload.filters ? { filters: payload.filters } : undefined,
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const sendConsentRequest = async ({
    userId,
    userType,
    applicationId,
}: UserPayload & { applicationId: string }) => {
    const resp: SuccessGenericResponse<any> = await ApiClient.post(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/applications/${applicationId}/consent/send`
    );
    return resp.data;
};

export const sendConsentViaDocusign = async ({
    userId,
    userType,
    applicationId,
}: UserPayload & { applicationId: string }) => {
    const resp: SuccessGenericResponse<any> = await ApiClient.post(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/applications/${applicationId}/consent/docusign`
    );
    return resp.data;
};

export const refreshConsentStatus = async ({
    userId,
    userType,
    applicationId,
}: UserPayload & { applicationId: string }) => {
    const resp: SuccessGenericResponse<any> = await ApiClient.get(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/applications/${applicationId}/consent/refresh`
    );
    return resp.data;
};

export const downloadConsentDocument = async ({
    userId,
    userType,
    applicationId,
    kind,
}: UserPayload & { applicationId: string; kind: 'signed' | 'certificate' }) => {
    const resp: SuccessGenericResponse<any> = await ApiClient.get(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/applications/${applicationId}/consent/document/${kind}`
    );
    return resp.data;
};

// Provider list API retired (vendor removed it). getProviderDetails is kept
// solely for the legacy-charges fallback on old applications that predate
// structured pricing — it fails soft (returns false) if the endpoint is gone.
export const getProviderDetails = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/providers/${payload.providerId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getForm = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/forms?country_id=${payload.country}&company_type=${payload.company_type}&region=${payload.region}&type=${payload.company_type}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getFormTableById = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/forms/table/${payload.tableId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getFormById = async (payload: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/forms/${payload.formId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const submitApplication = async ({
    userId,
    userType,
    formData,
    applicationId,
    skipAiValidation = false,
}: UserPayload & {
    formData: FormData;
    applicationId: string;
    skipAiValidation?: boolean;
}) => {
    // Errors are intentionally allowed to bubble up so callers (finalSubmit)
    // can extract `error.response.data.{message,errors}` and surface them in
    // the AI-check modal. Swallowing the error here drops the BE message.
    if (skipAiValidation) {
        formData.append('skip_ai_validation', 'true');
    }
    const resp: SuccessGenericResponse<any> = await ApiClient.post(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/application?applicationId=${applicationId}`,
        formData
    );
    const { data } = resp;
    return data;
};

export const checkWalletBalance = async ({ userId, userType, amount }: UserPayload & any) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/officeAndBusiness/global-business-setup/check-balance`,
            { amount }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const deletePendingApplication = async (
    payload: UserPayload & { applicationId: string }
) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.delete(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/applications/${payload.applicationId}`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const fetchPekoPlusDetails = async (): Promise<any | false> => {
    try {
        const res: SuccessGenericResponse<any> = await ApiClient.get(
            `/user/subscription/check-expired-subscription`
        );

        const { data } = res;

        return data;
    } catch (error) {
        return false;
    }
};

export const activatePekoPlus = async ({
    userId,
    userType,
    planId,
}: UserPayload & any): Promise<any | false> => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.post(
            `${userType}/${userId}/payment-gateway/subscriptions/global-business-setup`,
            { planId }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const getPackages = async () => {
    try {
        const resp: SuccessGenericResponse<PackagesData> = await ApiClient.get(
            `user/subscription/list-packages`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
export const getPlanPricing = async (
    payload: UserPayload & { country: string; company_type: string; freezone?: string }
) => {
    try {
        const resp: SuccessGenericResponse<PricingType[]> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/officeAndBusiness/global-business-setup/pricing`,
            {
                params: {
                    country: payload.country,
                    company_type: payload.company_type,
                    ...(payload.freezone ? { freezone: payload.freezone } : { freezone: '' }),
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const checkGlobalBusinessSetupStatus = async ({ userType, userId }: UserPayload) => {
    try {
        const resp: SuccessGenericResponse<any> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/global-business-setup/status`
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};

export const searchRenewalCompanies = async ({
    userId,
    userType,
    search,
}: UserPayload & { search: string }) => {
    const resp: SuccessGenericResponse<{ companies: any[] }> = await ApiClient.get(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/renewals/companies/search`,
        { params: { search } }
    );
    return resp.data;
};

export type Base93DownloadUrlResponse = {
    token: string;
    expires_in: number;
    content_type: string;
    name: string;
    download_url: string;
};

export const getFileDownloadUrl = async ({
    userId,
    userType,
    fileId,
}: UserPayload & { fileId: string }): Promise<Base93DownloadUrlResponse | false> => {
    try {
        const resp: SuccessGenericResponse<Base93DownloadUrlResponse> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/global-business-setup/files/${fileId}/download-url`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getRenewalFormConfig = async ({
    userId,
    userType,
    country,
    company_type,
    freezone,
}: UserPayload & { country?: string; company_type?: string; freezone?: string }) => {
    const resp: SuccessGenericResponse<Array<{ renewal_type: string; sections: any[] }>> =
        await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/global-business-setup/renewals/form-config`,
            { params: { country, company_type, freezone } }
        );
    return resp.data;
};

export const createRenewalRequest = async ({
    userId,
    userType,
    formData,
}: UserPayload & { formData: FormData }) => {
    const resp: SuccessGenericResponse<any> = await ApiClient.post(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/renewals`,
        formData
    );
    return resp.data;
};

export const requestRenewalRevision = async ({
    userId,
    userType,
    id,
}: UserPayload & { id: string }) => {
    const resp: SuccessGenericResponse<any> = await ApiClient.post(
        `${userType}/${userId}/officeAndBusiness/global-business-setup/renewals/${id}/request-revision`
    );
    return resp.data;
};
