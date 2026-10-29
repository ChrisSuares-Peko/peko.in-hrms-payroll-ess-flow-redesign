import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

// Admin cache reports — list GlobalBusinessSetupApplication / GlobalBusinessSetupRenewal records.
export const listAdminGlobalBusinessSetupApplications = async ({
    userId,
    userType,
    page = 1,
    itemsPerPage = 10,
    searchText,
    sort = 'DESC',
    isPaid,
}: UserPayload & {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    sort?: 'ASC' | 'DESC' | string;
    isPaid?: boolean;
}) => {
    try {
        const resp: SuccessGenericResponse<{ applications: any[]; total: number }> =
            await ApiClient.get(`${userType}/${userId}/officeAndBusiness/global-business-setup/applications`, {
                params: {
                    page,
                    itemsPerPage,
                    searchText,
                    sort,
                    ...(typeof isPaid === 'boolean' ? { isPaid } : {}),
                },
            });
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const listAdminGlobalBusinessSetupRenewals = async ({
    userId,
    userType,
    page = 1,
    itemsPerPage = 10,
    searchText,
    sort = 'DESC',
}: UserPayload & {
    page?: number;
    itemsPerPage?: number;
    searchText?: string;
    sort?: 'ASC' | 'DESC' | string;
}) => {
    try {
        const resp: SuccessGenericResponse<{ renewals: any[]; total: number }> =
            await ApiClient.get(`${userType}/${userId}/officeAndBusiness/global-business-setup/renewals`, {
                params: { page, itemsPerPage, searchText, sort },
            });
        return resp.data;
    } catch (err) {
        return false;
    }
};

// Download helpers — return a buffer + file type that the hook turns into a Blob.
// Backend routes: /applications/download/pdf | /download/:type (csv/excel).
export const downloadAdminGlobalBusinessSetupApplications = async ({
    userId,
    userType,
    type,
    searchText,
    sort = 'DESC',
    isPaid,
}: UserPayload & {
    type: 'excel' | 'csv' | 'pdf';
    searchText?: string;
    sort?: 'ASC' | 'DESC' | string;
    isPaid?: boolean;
}) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/global-business-setup/applications/download/${type}`,
            {
                params: {
                    searchText,
                    sort,
                    ...(typeof isPaid === 'boolean' ? { isPaid } : {}),
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadAdminGlobalBusinessSetupRenewals = async ({
    userId,
    userType,
    type,
    searchText,
    sort = 'DESC',
}: UserPayload & {
    type: 'excel' | 'csv' | 'pdf';
    searchText?: string;
    sort?: 'ASC' | 'DESC' | string;
}) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${userType}/${userId}/officeAndBusiness/global-business-setup/renewals/download/${type}`,
            { params: { searchText, sort } }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};
