import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { CorporateAgreementReview, CorporateDocumentsResponse } from '../types/corporateDocuments';

interface UserContext {
    userId: string | number;
    userType: string;
}

export const getCorporateDocumentsForAdmin = async (
    ctx: UserContext,
    corporateId: number
): Promise<CorporateDocumentsResponse | false> => {
    try {
        const resp: SuccessGenericResponse<CorporateDocumentsResponse> = await ApiClient.get(
            `${ctx.userType}/${ctx.userId}/corporate-cards/corporate-documents/${corporateId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const getCorporateDocumentFileForAdmin = async (
    ctx: UserContext,
    docKey: string
): Promise<{ buffer: { data: number[] }; type: string } | false> => {
    try {
        const resp: SuccessGenericResponse<{ buffer: { data: number[] }; type: string }> =
            await ApiClient.get(`${ctx.userType}/${ctx.userId}/corporate-cards/document/${docKey}`);
        return resp.data;
    } catch {
        return false;
    }
};

export const downloadAllCorporateDocumentsForAdmin = async (
    ctx: UserContext,
    corporateId: number
): Promise<Blob | false> => {
    try {
        const resp = (await ApiClient.get(
            `${ctx.userType}/${ctx.userId}/corporate-cards/corporate-documents/${corporateId}/download-all`,
            { responseType: 'blob' }
        )) as unknown as Blob;
        return resp;
    } catch {
        return false;
    }
};

export const getCorporateAgreementForAdmin = async (
    ctx: UserContext,
    corporateId: number
): Promise<CorporateAgreementReview | false> => {
    try {
        const resp: SuccessGenericResponse<CorporateAgreementReview> = await ApiClient.get(
            `${ctx.userType}/${ctx.userId}/corporate-cards/corporate-agreement/${corporateId}`
        );
        return resp.data;
    } catch {
        return false;
    }
};

export const regenerateCorporateAgreement = async (
    ctx: UserContext,
    corporateId: number
): Promise<boolean> => {
    try {
        await ApiClient.post(
            `${ctx.userType}/${ctx.userId}/corporate-cards/corporate-agreement/${corporateId}/regenerate`
        );
        return true;
    } catch {
        return false;
    }
};
