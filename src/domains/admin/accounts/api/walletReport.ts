import { CommonFileBuffer, SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { getData } from '../../reports/types';
import {
    CorporateListResponse,
    walletListingResponse,
    walletReportListing,
} from '../types/WalletReportTypes';

export const walletReportListingApi = async ({
    userId,
    userType,
    page,
    fromDate,
    toDate,
    sort,
    corporateId = '',
    searchText = '',
    sortField,
}: walletReportListing) => {
    try {
        const res: SuccessGenericResponse<walletListingResponse> = await ApiClient.get(
            `${userType}/${userId}/others/walletReports/all`,
            {
                params: {
                    from: fromDate,
                    to: toDate,
                    itemsPerPage: 10,
                    searchText,
                    page,
                    corporateId,
                    sort,
                    sortField,
                },
            }
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const getAllCorporates = async ({ userType, userId, searchText }: any) => {
    try {
        const res: SuccessGenericResponse<CorporateListResponse> = await ApiClient.get(
            `${userType}/${userId}/others/transferFunds/corporate-users?searchText=${searchText}`
        );
        const { data } = res;
        return data;
    } catch (error) {
        return false;
    }
};

export const retryWalletTransferJournal = async ({
    userId,
    userType,
    id,
}: UserPayload & { id: number }) => {
    try {
        const res: SuccessGenericResponse<{ success: boolean; reason?: string }> =
            await ApiClient.put(
                `${userType}/${userId}/others/walletReports/${id}/journal/retry`,
                {}
            );
        return res.data;
    } catch (error) {
        return (error as any)?.response?.data ?? false;
    }
};
export const getFileBufferReport = async (payload: UserPayload & getData) => {
    try {
        const resp: SuccessGenericResponse<CommonFileBuffer> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/walletReports/${payload.type}`,
            {
                params: {
                    sort: payload.sort,
                    searchText: payload.searchText || '',
                    to: payload.to,
                    from: payload.from,
                    corporateId: payload.id,
                },
            }
        );
        const { data } = resp;
        return data;
    } catch (err) {
        return false;
    }
};
