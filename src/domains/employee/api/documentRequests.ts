import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';
import { DocumentRequest } from '../types';

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const requestDocumentApi = async (
    scope: OnboardingScope,
    documentType: string,
    purpose?: string
) => {
    const resp: SuccessGenericResponse<DocumentRequest> = await ApiClient.post(
        `${base(scope)}/document-requests`,
        { documentType, purpose }
    );
    return resp.data;
};

export const getActiveDocumentRequests = async (scope: OnboardingScope): Promise<DocumentRequest[]> => {
    try {
        const resp: SuccessGenericResponse<{ requests: DocumentRequest[] }> = await ApiClient.get(
            `${base(scope)}/document-requests/active`
        );
        return resp.data.requests;
    } catch (err) {
        return [];
    }
};
