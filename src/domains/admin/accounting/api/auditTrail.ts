import { SuccessGenericResponse, UserPayload } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { AuditTrailFilters, AuditTrailResponse } from '../types/auditTrail';
import { ExportFormat } from '../types/export';

const base = ({ userType, userId }: UserPayload) =>
    `${userType}/${userId}/others/accounting/config-audit-logs`;

const paramsOf = ({
    configType,
    source,
    partnerName,
    from,
    to,
    ...filters
}: Partial<AuditTrailFilters>) => ({
    ...filters,
    ...(configType ? { configType } : {}),
    ...(source ? { source } : {}),
    ...(partnerName ? { partnerName } : {}),
    ...(from && to ? { from, to } : {}),
});

export const getAuditTrail = async (payload: UserPayload & AuditTrailFilters) => {
    try {
        const { userId, userType, ...filters } = payload;
        const resp: SuccessGenericResponse<AuditTrailResponse> = await ApiClient.get(
            base({ userId, userType }),
            { params: paramsOf(filters) }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export type AuditTrailExportQuery = Omit<AuditTrailFilters, 'page' | 'itemsPerPage'> & {
    format: ExportFormat;
};

export const downloadAuditTrail = async (payload: UserPayload & AuditTrailExportQuery) => {
    try {
        const { userId, userType, format, ...filters } = payload;
        const resp = await ApiClient.get(`${base({ userId, userType })}/export/${format}`, {
            params: paramsOf(filters),
            responseType: 'blob',
        });
        return resp as unknown as Blob;
    } catch (err) {
        return false;
    }
};
