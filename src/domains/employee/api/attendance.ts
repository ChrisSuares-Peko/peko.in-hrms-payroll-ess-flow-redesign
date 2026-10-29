import { SuccessGenericResponse } from '@customtypes/general';
import { ApiClient } from '@src/services/config';

import { OnboardingScope } from './onboarding';
import { DisputeStatus } from '../types';

export type AttendanceApiStatus = 'present' | 'late' | 'absent' | 'on-leave' | 'half-day';

export interface AttendanceApiRecord {
    _id: string;
    date: string;
    checkIn?: { time?: string; lat?: number; lng?: number; method?: 'ess' | 'manual' };
    checkOut?: { time?: string; lat?: number; lng?: number };
    status: AttendanceApiStatus;
    lateMinutes?: number;
    totalHours?: number;
    notes?: string;
    disputeRaised?: boolean;
    disputeStatus?: DisputeStatus;
}

interface AttendanceListQuery {
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export interface AttendanceMetrics {
    totalCheckIns: number;
    totalLateArrivals: number;
    totalLeaves: number;
    onTime: number;
    late: number;
    notPresent: number;
    total: number;
}

const base = ({ userType, userId }: OnboardingScope) => `${userType}/${userId}/payroll`;

const buildQuery = (query: Record<string, any>) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, String(value));
    });
    const qs = params.toString();
    return qs ? `?${qs}` : '';
};

export const getCheckInOutStatus = async (scope: OnboardingScope): Promise<boolean> => {
    try {
        const resp: SuccessGenericResponse<{ checkInOutEnabled: boolean }> = await ApiClient.get(
            `${base(scope)}/attendance/check-in-status`
        );
        return resp.data.checkInOutEnabled;
    } catch (err) {
        return true;
    }
};

export const getCheckInAvailability = async (
    scope: OnboardingScope
): Promise<{ isCheckInAvailable: boolean; reason: string | null }> => {
    try {
        const resp: SuccessGenericResponse<{ isCheckInAvailable: boolean; reason: string | null }> =
            await ApiClient.get(`${base(scope)}/attendance/check-in-available`);
        return resp.data;
    } catch (err) {
        return { isCheckInAvailable: true, reason: null };
    }
};

export const checkInApi = async (
    scope: OnboardingScope,
    body: { checkIn?: { lat?: number; lng?: number }; notes?: string }
): Promise<AttendanceApiRecord> => {
    const resp: SuccessGenericResponse<AttendanceApiRecord> = await ApiClient.post(
        `${base(scope)}/attendance/check-in`,
        body
    );
    return resp.data;
};

export const checkOutApi = async (
    scope: OnboardingScope,
    body: { checkOut?: { lat?: number; lng?: number }; notes?: string }
): Promise<AttendanceApiRecord> => {
    const resp: SuccessGenericResponse<AttendanceApiRecord> = await ApiClient.post(
        `${base(scope)}/attendance/check-out`,
        body
    );
    return resp.data;
};

export const getAttendanceMetrics = async (
    scope: OnboardingScope,
    query?: string | { from?: string; to?: string }
): Promise<AttendanceMetrics> => {
    try {
        // Back-compat: a plain string is still treated as `month` (used by the Dashboard widget).
        const params = typeof query === 'string' ? { month: query } : (query ?? {});
        const qs = buildQuery(params);
        const resp: SuccessGenericResponse<AttendanceMetrics> = await ApiClient.get(
            `${base(scope)}/attendance/metrics${qs}`
        );
        return resp.data;
    } catch (err) {
        return {
            totalCheckIns: 0,
            totalLateArrivals: 0,
            totalLeaves: 0,
            onTime: 0,
            late: 0,
            notPresent: 0,
            total: 0,
        };
    }
};

export const getAttendanceList = async (
    scope: OnboardingScope,
    query: AttendanceListQuery = {}
): Promise<{ records: AttendanceApiRecord[]; total: number }> => {
    try {
        const qs = buildQuery(query);
        const resp: SuccessGenericResponse<{ records: AttendanceApiRecord[]; total: number }> =
            await ApiClient.get(`${base(scope)}/attendance${qs}`);
        return resp.data;
    } catch (err) {
        return { records: [], total: 0 };
    }
};
