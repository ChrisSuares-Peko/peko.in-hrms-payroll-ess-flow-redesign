import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getMyAnnouncements } from '../api/announcements';
import {
    AttendanceApiRecord,
    AttendanceApiStatus,
    checkInApi,
    checkOutApi,
    getAttendanceList,
    getAttendanceMetrics,
    getCheckInAvailability,
    getCheckInOutStatus,
} from '../api/attendance';
import { getEmployeeProfile } from '../api/onboarding';
import { DashboardAttendanceRow, DashboardAttendanceStatus, EmployeeDashboard } from '../types';
import { formatHours } from '../utils/attendanceMappers';

const FALLBACK = '—';

const EMPTY_STAT = { onTime: 0, late: 0, notPresent: 0, total: 0 };

const buildInitialData = (): EmployeeDashboard => ({
    profile: {
        name: FALLBACK,
        designation: FALLBACK,
        department: FALLBACK,
        employeeId: FALLBACK,
        today: new Date().toISOString(),
        isCheckedIn: false,
        isCheckedOut: false,
        isLate: false,
        shiftComplete: false,
        checkInOutEnabled: true,
        isCheckInAvailable: true,
    },
    attendance: EMPTY_STAT,
    attendanceRecords: [],
    announcements: [],
});

// Parse a schedule string like "09:30 AM - 06:30 PM" into worked-hours span.
const scheduledHours = (schedule?: string): number | null => {
    if (!schedule) return null;
    const toMinutes = (t: string): number | null => {
        const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!m) return null;
        const hour = (parseInt(m[1], 10) % 12) + (/pm/i.test(m[3]) ? 12 : 0);
        return hour * 60 + parseInt(m[2], 10);
    };
    const [start, end] = schedule.split('-').map(part => toMinutes(part));
    if (start == null || end == null) return null;
    const mins = end > start ? end - start : end - start + 24 * 60; // handle overnight
    return mins / 60;
};

const mapStatus = (status: AttendanceApiStatus): DashboardAttendanceStatus => {
    if (status === 'late') return 'Late';
    if (status === 'present' || status === 'half-day') return 'Present';
    if (status === 'on-leave') return 'Leave';
    return 'Absent';
};

const toRow = (record: AttendanceApiRecord): DashboardAttendanceRow => ({
    id: record._id,
    name: dayjs(record.date).format('DD-MM-YYYY'),
    joinDate: record.checkIn?.time ? dayjs(record.checkIn.time).format('HH:mm') : FALLBACK,
    checkout: record.checkOut?.time ? dayjs(record.checkOut.time).format('HH:mm') : FALLBACK,
    hours: formatHours(record.totalHours) ?? FALLBACK,
    status: mapStatus(record.status),
});

export const useEmployeeDashboard = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [data, setData] = useState<EmployeeDashboard>(buildInitialData);
    const [isLoading, setIsLoading] = useState(true);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [checkOutLoading, setCheckOutLoading] = useState(false);

    const load = useCallback(async () => {
        // Avoid firing employee-only requests during a role switch.
        if (role !== 'user') return;
        const scope = { userType: role, userId: id };
        setIsLoading(true);

        const [profile, { records }, metrics, announcements, checkInOutEnabled, availability] =
            await Promise.all([
                getEmployeeProfile(scope),
                getAttendanceList(scope, { limit: 30 }),
                // Dashboard widget always shows the current calendar month explicitly.
                getAttendanceMetrics(scope, dayjs().format('YYYY-MM')),
                getMyAnnouncements(scope),
                getCheckInOutStatus(scope),
                getCheckInAvailability(scope),
            ]);

        // Attendance is fetched once and reused for both today's live status and
        // the recent-activity table, rather than a separate today-only fetch.
        const todayRecord = records.find(r => dayjs(r.date).isSame(dayjs(), 'day')) ?? null;

        const empInfo = profile?.employeeInformation;
        const department =
            empInfo?.department && typeof empInfo.department === 'object'
                ? (empInfo.department.departmentName ?? FALLBACK)
                : FALLBACK;

        // "Shift Complete" only when checked out AND worked >= half the scheduled
        // shift (falls back to a 1h floor when no schedule is set) — a 5-min shift
        // isn't "complete" just because the employee happened to check out.
        const isCheckedOut = !!todayRecord?.checkOut?.time;
        const totalHours = todayRecord?.totalHours;
        const expectedHours = scheduledHours(empInfo?.timeSchedule);
        const completeThreshold = expectedHours && expectedHours > 0 ? expectedHours * 0.5 : 1;
        const shiftComplete =
            isCheckedOut && typeof totalHours === 'number' && totalHours >= completeThreshold;

        setData({
            profile: {
                name: profile?.personalInformation?.fullName ?? FALLBACK,
                designation: empInfo?.designation ?? FALLBACK,
                department,
                employeeId: empInfo?.employeeId ?? FALLBACK,
                avatar: profile?.profileImage,
                today: new Date().toISOString(),
                isCheckedIn: !!todayRecord?.checkIn?.time,
                isCheckedOut,
                isLate: todayRecord?.status === 'late',
                lateMinutes: todayRecord?.lateMinutes,
                checkInTime: todayRecord?.checkIn?.time,
                totalHours,
                shiftComplete,
                checkInOutEnabled,
                isCheckInAvailable: availability.isCheckInAvailable,
                checkInUnavailableReason: availability.reason ?? undefined,
            },
            attendance: {
                onTime: metrics.onTime,
                late: metrics.late,
                notPresent: metrics.notPresent,
                total: metrics.total,
            },
            attendanceRecords: records.slice(0, 5).map(toRow),
            announcements: announcements.map(a => ({
                id: a.id ?? a._id ?? '',
                title: a.subject,
                description: a.details,
                date: dayjs(a.createdAt).format('DD-MM-YYYY'),
            })),
        });
        setIsLoading(false);
    }, [role, id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleCheckIn = async () => {
        setCheckInLoading(true);
        try {
            await checkInApi({ userType: role, userId: id }, {});
            await load();
        } catch (err: any) {
            dispatch(
                showToast({
                    description: err?.response?.data?.message || 'Something went wrong.',
                    variant: 'error',
                })
            );
        } finally {
            setCheckInLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setCheckOutLoading(true);
        try {
            await checkOutApi({ userType: role, userId: id }, {});
            await load();
        } catch (err: any) {
            dispatch(
                showToast({
                    description: err?.response?.data?.message || 'Something went wrong.',
                    variant: 'error',
                })
            );
        } finally {
            setCheckOutLoading(false);
        }
    };

    return {
        data,
        isLoading,
        checkInLoading,
        checkOutLoading,
        handleCheckIn,
        handleCheckOut,
        reload: load,
    };
};
