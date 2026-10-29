import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';

export interface UploadUserDocumentPayload {
    name: string;
    holderName?: string;
    expiryDate?: string;
    url: { base64: string; format: string };
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const uploadUserDocument = async (scope: OnboardingScope, body: UploadUserDocumentPayload) => {
    const resp: SuccessGenericResponse<unknown> = await ApiClient.post(`${base(scope)}/documents`, body);
    return resp.data;
};

export const downloadUserDocument = async (scope: OnboardingScope, documentId: string): Promise<Blob> => {
    const blob: Blob = await ApiClient.get(`${base(scope)}/documents/${documentId}/download`, {
        responseType: 'blob',
    });
    return blob;
};
