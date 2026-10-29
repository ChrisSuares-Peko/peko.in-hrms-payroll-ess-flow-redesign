import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { DocumentSizeLimitsResponse } from '../types/corporateCardDocumentLimits';

interface UserContext {
    userId: string | number;
    userType: string;
}

const basePath = (ctx: UserContext) =>
    `${ctx.userType}/${ctx.userId}/corporate-cards/document-size-limits`;

export const getDocumentSizeLimits = async (
    ctx: UserContext
): Promise<DocumentSizeLimitsResponse | false> => {
    try {
        const resp: SuccessGenericResponse<DocumentSizeLimitsResponse> = await ApiClient.get(
            basePath(ctx)
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const updateDocumentSizeLimits = async (
    ctx: UserContext,
    payload: { limits?: Record<string, number>; totals?: Record<string, number> }
): Promise<DocumentSizeLimitsResponse | false> => {
    try {
        const resp: SuccessGenericResponse<DocumentSizeLimitsResponse> = await ApiClient.put(
            basePath(ctx),
            payload
        );
        return resp.data;
    } catch {
        return false;
    }
};
