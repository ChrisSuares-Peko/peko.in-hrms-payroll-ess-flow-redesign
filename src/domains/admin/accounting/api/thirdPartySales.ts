import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { ExportFormat } from '../types/export';
import {
    ThirdPartySaleKind,
    ThirdPartySalesFilters,
    ThirdPartySalesResponse,
} from '../types/thirdPartySales';

const base = ({ userType, userId }: UserPayload, kind: ThirdPartySaleKind) =>
    `${userType}/${userId}/others/accounting/third-party-sales/${kind}`;

export const getThirdPartySales = async (payload: UserPayload & ThirdPartySalesFilters) => {
    try {
        const { userId, userType, kind, status, ...filters } = payload;
        const resp: SuccessGenericResponse<ThirdPartySalesResponse> = await ApiClient.get(
            base({ userId, userType }, kind),
            {
                params: {
                    ...filters,
                    ...(status ? { status } : {}),
                },
            }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export type ThirdPartySalesExportQuery = Omit<ThirdPartySalesFilters, 'page' | 'itemsPerPage'> & {
    format: ExportFormat;
};

export const downloadThirdPartySales = async (
    payload: UserPayload & ThirdPartySalesExportQuery
) => {
    try {
        const { userId, userType, kind, status, format, ...filters } = payload;
        const resp = await ApiClient.get(`${base({ userId, userType }, kind)}/export/${format}`, {
            params: {
                ...filters,
                ...(status ? { status } : {}),
            },
            responseType: 'blob',
        });
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};
