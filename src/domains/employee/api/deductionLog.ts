import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';
import { DeductionLogRecord } from '../types';

interface DeductionLogQuery {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const getDeductionLog = async (
    scope: OnboardingScope,
    query: DeductionLogQuery = {}
): Promise<{ records: DeductionLogRecord[]; total: number }> => {
    try {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== '') params.append(key, String(value));
        });
        const qs = params.toString() ? `?${params.toString()}` : '';

        const resp: SuccessGenericResponse<{ records: DeductionLogRecord[]; total: number }> =
            await ApiClient.get(`${base(scope)}/deduction-log${qs}`);
        return resp.data;
    } catch (err) {
        return { records: [], total: 0 };
    }
};
