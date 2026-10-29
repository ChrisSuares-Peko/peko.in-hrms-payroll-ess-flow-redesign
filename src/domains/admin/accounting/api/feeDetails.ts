import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { OrderDocumentAvailability } from '@src/domains/admin/reports/types/orderJournal';
import { ApiClient } from '@src/services/config';

import { ExportFormat } from '../types/export';
import { Posting } from '../types/posting';
import { AccountScope } from '../utils/accountScope';

export type FeeType = 'commission' | 'platformFee';

export type FeeDetailsQuery = {
    feeType: FeeType;
    page: number;
    itemsPerPage: number;
    searchText?: string;
    from?: string;
    to?: string;
    vendorId?: number;
    accounts?: AccountScope;
};

export type FeeDetailsExportQuery = Omit<FeeDetailsQuery, 'page' | 'itemsPerPage'> & {
    format: ExportFormat;
};

export type FeeDetailsRow = {
    id: number;
    corporateTxnId: string;
    transactionDate: string;
    service: string | null;
    vendorName: string | null;
    orderValue: number;
    feeExcludingGST: number;
    feeIncludingGST: number;
    // Commission only — platform fee has no reversal concept.
    feeReversed?: number;
    feeNet?: number;
    posting: Posting;
    documents: OrderDocumentAvailability;
};

export type FeeDetailsResponse = {
    result: FeeDetailsRow[];
    totalData: number;
};

export const getFeeDetails = async (payload: UserPayload & FeeDetailsQuery) => {
    try {
        const resp: SuccessGenericResponse<FeeDetailsResponse> = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/order-journals/fee-details`,
            {
                params: {
                    feeType: payload.feeType,
                    page: payload.page,
                    itemsPerPage: payload.itemsPerPage,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                    vendorId: payload.vendorId,
                    accounts: payload.accounts,
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadFeeDetails = async (payload: UserPayload & FeeDetailsExportQuery) => {
    try {
        const resp = await ApiClient.get(
            `${payload.userType}/${payload.userId}/others/order-journals/fee-details/export/${payload.format}`,
            {
                params: {
                    feeType: payload.feeType,
                    searchText: payload.searchText,
                    from: payload.from,
                    to: payload.to,
                    vendorId: payload.vendorId,
                    accounts: payload.accounts,
                },
                responseType: 'blob',
            }
        );
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};
