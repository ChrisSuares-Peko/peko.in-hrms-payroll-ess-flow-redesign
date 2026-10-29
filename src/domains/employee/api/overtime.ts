import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';

export type OvertimeApiStatus =
    | 'requestedByEmployee'
    | 'approved'
    | 'rejected'
    | 'cancelledByEmployee';

export interface OvertimeApiRecord {
    id: string;
    overTimeDate: string;
    extraHours: number;
    notes?: string;
    status: OvertimeApiStatus;
    paymentStatus?: string;
}

interface OvertimeListQuery {
    status?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export interface OvertimeSummary {
    totalOtHours: number;
    approvedCount: number;
    pendingCount: number;
}

export interface RequestOvertimeBody {
    date: string;
    hours: number;
    notes?: string;
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const getMyOvertime = async (
    scope: OnboardingScope,
    query: OvertimeListQuery = {}
): Promise<{ records: OvertimeApiRecord[]; total: number; summary: OvertimeSummary } | false> => {
    try {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== '') params.append(key, String(value));
        });
        const qs = params.toString() ? `?${params.toString()}` : '';

        const resp: SuccessGenericResponse<{
            records: OvertimeApiRecord[];
            total: number;
            summary: OvertimeSummary;
        }> = await ApiClient.get(`${base(scope)}/overtime-requests${qs}`);
        return resp.data;
    } catch (err) {
        return false;
    }
};

export const requestOvertimeApi = async (
    scope: OnboardingScope,
    body: RequestOvertimeBody
): Promise<OvertimeApiRecord> => {
    const resp: SuccessGenericResponse<OvertimeApiRecord> = await ApiClient.post(
        `${base(scope)}/overtime-requests`,
        body
    );
    return resp.data;
};

export const cancelOvertimeApi = async (
    scope: OnboardingScope,
    overtimeId: string
): Promise<OvertimeApiRecord> => {
    const resp: SuccessGenericResponse<OvertimeApiRecord> = await ApiClient.patch(
        `${base(scope)}/overtime-requests/${overtimeId}/cancel`
    );
    return resp.data;
};
