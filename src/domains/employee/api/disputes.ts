import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';

export interface RaiseDisputeBody {
    attendanceId: string;
    reason: string;
    supportingDocs?: { base64: string; format: string };
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const raiseDisputeApi = async (
    scope: OnboardingScope,
    body: RaiseDisputeBody
): Promise<unknown> => {
    const resp: SuccessGenericResponse<unknown> = await ApiClient.post(`${base(scope)}/leave/disputes`, body);
    return resp.data;
};
