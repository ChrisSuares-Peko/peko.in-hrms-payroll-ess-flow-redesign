import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';
import { PayslipRow } from '../types';

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const getMyPayslips = async (
    scope: OnboardingScope,
    query: { year: string }
): Promise<{ rows: PayslipRow[] } | false> => {
    try {
        const resp: SuccessGenericResponse<{ rows: PayslipRow[] }> = await ApiClient.get(
            `${base(scope)}/payslips`,
            { params: query }
        );
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const downloadMyPayslipApi = async (
    scope: OnboardingScope,
    salaryId: string
): Promise<Blob> => {
    const blob: Blob = await ApiClient.get(`${base(scope)}/payslips/${salaryId}/download`, {
        responseType: 'blob',
    });
    return blob;
};
