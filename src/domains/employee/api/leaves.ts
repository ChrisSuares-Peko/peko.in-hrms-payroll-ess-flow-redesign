import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';
import { AvailableLeave, HolidayDoc, LeaveDoc } from '../types';

interface LeaveListQuery {
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface ApplyLeaveBody {
    start: string;
    end: string;
    leaveCount: number;
    typeOfLeave?: string;
    isUnpaidLeave?: boolean;
    halfDaySelection?: 'FIRST_HALF' | 'SECOND_HALF';
    notes?: string;
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

export const getLeaveBalance = async (scope: OnboardingScope): Promise<AvailableLeave[]> => {
    try {
        const resp: SuccessGenericResponse<{ availableLeaves: AvailableLeave[] }> =
            await ApiClient.get(`${base(scope)}/leave-balance`);
        return resp.data.availableLeaves;
    } catch (err) {
        return [];
    }
};

export const getMyLeaves = async (
    scope: OnboardingScope,
    query: LeaveListQuery = {}
): Promise<{ records: LeaveDoc[]; total: number }> => {
    try {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== '') params.append(key, String(value));
        });
        const qs = params.toString() ? `?${params.toString()}` : '';

        const resp: SuccessGenericResponse<{ records: LeaveDoc[]; total: number }> =
            await ApiClient.get(`${base(scope)}/leave-applications${qs}`);
        return resp.data;
    } catch (err) {
        return { records: [], total: 0 };
    }
};

export const applyLeaveApi = async (
    scope: OnboardingScope,
    body: ApplyLeaveBody
): Promise<LeaveDoc> => {
    const resp: SuccessGenericResponse<LeaveDoc> = await ApiClient.post(
        `${base(scope)}/leave-applications`,
        body
    );
    return resp.data;
};

export const cancelLeaveApi = async (
    scope: OnboardingScope,
    leaveId: string
): Promise<LeaveDoc> => {
    const resp: SuccessGenericResponse<LeaveDoc> = await ApiClient.patch(
        `${base(scope)}/leave-applications/${leaveId}/cancel`
    );
    return resp.data;
};

interface HolidayListQuery {
    start?: string;
    end?: string;
    category?: string;
    page?: number;
    limit?: number;
}

export const getHolidays = async (
    scope: OnboardingScope,
    query: HolidayListQuery = {}
): Promise<{ holidays: HolidayDoc[]; total: number }> => {
    try {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== '') params.append(key, String(value));
        });
        const qs = params.toString() ? `?${params.toString()}` : '';

        const resp: SuccessGenericResponse<{ holidays: HolidayDoc[]; total: number }> =
            await ApiClient.get(`${base(scope)}/holidays${qs}`);
        return resp.data;
    } catch (err) {
        return { holidays: [], total: 0 };
    }
};
