import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { ExportFormat } from '../types/export';
import { OtherSalesFilters, OtherSalesResponse } from '../types/otherSales';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/other-sales`;

export const getOtherSales = async (payload: UserPayload & OtherSalesFilters) => {
    try {
        const { userId, userType, vendorId, partnerId, ...filters } = payload;
        const resp: SuccessGenericResponse<OtherSalesResponse> = await ApiClient.get(
            base({ userId, userType }),
            {
                params: {
                    ...filters,
                    ...(vendorId ? { vendorId } : {}),
                    ...(partnerId ? { partnerId } : {}),
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export type OtherSalesExportQuery = Omit<OtherSalesFilters, 'page' | 'itemsPerPage'> & {
    format: ExportFormat;
};

export const downloadOtherSales = async (payload: UserPayload & OtherSalesExportQuery) => {
    try {
        const { userId, userType, vendorId, partnerId, format, ...filters } = payload;
        const resp = await ApiClient.get(`${base({ userId, userType })}/export/${format}`, {
            params: {
                ...filters,
                ...(vendorId ? { vendorId } : {}),
                ...(partnerId ? { partnerId } : {}),
            },
            responseType: 'blob',
        });
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};
