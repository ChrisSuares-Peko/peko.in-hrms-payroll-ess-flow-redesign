import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { getMyAnnouncements } from '../../api/announcements';
import {
    checkInApi,
    checkOutApi,
    getAttendanceList,
    getAttendanceMetrics,
    getCheckInAvailability,
    getCheckInOutStatus,
} from '../../api/attendance';
import { getEmployeeProfile } from '../../api/onboarding';
import { useEmployeeDashboard } from '../../hooks/useEmployeeDashboard';

vi.mock('../../api/announcements', () => ({
    getMyAnnouncements: vi.fn(),
}));

vi.mock('../../api/attendance', () => ({
    checkInApi: vi.fn(),
    checkOutApi: vi.fn(),
    getAttendanceList: vi.fn(),
    getAttendanceMetrics: vi.fn(),
    getCheckInAvailability: vi.fn(),
    getCheckInOutStatus: vi.fn(),
}));

vi.mock('../../api/onboarding', () => ({
    getEmployeeProfile: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 42, role: 'employee' })),
    useAppDispatch: () => dispatchMock,
}));

const today = dayjs();
const yesterday = dayjs().subtract(1, 'day');

const todayRecord = {
    _id: 'today1',
    date: today.toISOString(),
    checkIn: { time: today.hour(9).minute(15).second(0).toISOString() },
    checkOut: { time: today.hour(18).minute(0).second(0).toISOString() },
    status: 'late' as const,
    lateMinutes: 15,
    totalHours: 8.75,
};

const yesterdayRecord = {
    _id: 'y1',
    date: yesterday.toISOString(),
    checkIn: { time: yesterday.hour(9).minute(0).second(0).toISOString() },
    checkOut: { time: yesterday.hour(17).minute(30).second(0).toISOString() },
    status: 'present' as const,
    totalHours: 8.5,
};

const mockProfile = {
    personalInformation: { fullName: 'Jane Smith' },
    employeeInformation: {
        designation: 'Developer',
        employeeId: 'EMP007',
        department: { departmentName: 'Engineering' },
    },
    profileImage: 'https://example.com/avatar.png',
};

const mockMetrics = {
    totalCheckIns: 10,
    totalLateArrivals: 2,
    totalLeaves: 1,
    onTime: 8,
    late: 2,
    notPresent: 0,
    total: 10,
};

const mockAnnouncements = [
    { id: 'ann1', subject: 'Holiday Notice', details: 'Office closed', createdAt: '2024-01-10T00:00:00.000Z' },
];

const setupDefaultMocks = () => {
    (getEmployeeProfile as Mock).mockResolvedValue(mockProfile);
    (getAttendanceList as Mock).mockResolvedValue({
        records: [todayRecord, yesterdayRecord],
        total: 2,
    });
    (getAttendanceMetrics as Mock).mockResolvedValue(mockMetrics);
    (getMyAnnouncements as Mock).mockResolvedValue(mockAnnouncements);
    (getCheckInOutStatus as Mock).mockResolvedValue(true);
    (getCheckInAvailability as Mock).mockResolvedValue({ isCheckInAvailable: true, reason: null });
};

beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
});

describe('useEmployeeDashboard', () => {
    it('starts in a loading state', () => {
        const { result } = renderHook(() => useEmployeeDashboard());

        expect(result.current.isLoading).toBe(true);
    });

    it('loads and maps profile, attendance, metrics and announcements on mount', async () => {
        const { result } = renderHook(() => useEmployeeDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getEmployeeProfile).toHaveBeenCalledWith({ userType: 'employee', userId: 42 });
        expect(getAttendanceList).toHaveBeenCalledWith(
            { userType: 'employee', userId: 42 },
            { limit: 30 }
        );

        const { data } = result.current;

        expect(data.profile.name).toBe('Jane Smith');
        expect(data.profile.designation).toBe('Developer');
        expect(data.profile.department).toBe('Engineering');
        expect(data.profile.employeeId).toBe('EMP007');
        expect(data.profile.avatar).toBe('https://example.com/avatar.png');
        expect(data.profile.isCheckedIn).toBe(true);
        expect(data.profile.isCheckedOut).toBe(true);
        expect(data.profile.isLate).toBe(true);
        expect(data.profile.lateMinutes).toBe(15);
        expect(data.profile.checkInTime).toBe(todayRecord.checkIn.time);
        expect(data.profile.totalHours).toBe(8.75);
        expect(data.profile.shiftComplete).toBe(true);
        expect(data.profile.checkInOutEnabled).toBe(true);
        expect(data.profile.isCheckInAvailable).toBe(true);
        expect(data.profile.checkInUnavailableReason).toBeUndefined();

        expect(data.attendance).toEqual({ onTime: 8, late: 2, notPresent: 0, total: 10 });

        expect(data.attendanceRecords).toHaveLength(2);
        expect(data.attendanceRecords[0]).toEqual({
            id: 'today1',
            name: dayjs(todayRecord.date).format('DD-MM-YYYY'),
            joinDate: dayjs(todayRecord.checkIn.time).format('HH:mm'),
            checkout: dayjs(todayRecord.checkOut.time).format('HH:mm'),
            hours: '8h 45m',
            status: 'Late',
        });

        expect(data.announcements).toEqual([
            {
                id: 'ann1',
                title: 'Holiday Notice',
                description: 'Office closed',
                date: dayjs('2024-01-10T00:00:00.000Z').format('DD-MM-YYYY'),
            },
        ]);
    });

    it('falls back to placeholder values when profile fields are missing', async () => {
        (getEmployeeProfile as Mock).mockResolvedValue({});
        (getAttendanceList as Mock).mockResolvedValue({ records: [], total: 0 });

        const { result } = renderHook(() => useEmployeeDashboard());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.data.profile.name).toBe('—');
        expect(result.current.data.profile.designation).toBe('—');
        expect(result.current.data.profile.department).toBe('—');
        expect(result.current.data.profile.employeeId).toBe('—');
        expect(result.current.data.profile.isCheckedIn).toBe(false);
        expect(result.current.data.profile.isCheckedOut).toBe(false);
        expect(result.current.data.attendanceRecords).toEqual([]);
    });

    it('checks in successfully and reloads the dashboard data', async () => {
        (checkInApi as Mock).mockResolvedValueOnce(todayRecord);

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getEmployeeProfile).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.handleCheckIn();
        });

        expect(checkInApi).toHaveBeenCalledWith({ userType: 'employee', userId: 42 }, {});
        expect(result.current.checkInLoading).toBe(false);
        expect(dispatchMock).not.toHaveBeenCalled();
        // load() runs again after a successful check-in
        expect(getEmployeeProfile).toHaveBeenCalledTimes(2);
    });

    it('sets checkInLoading while the check-in request is in flight', async () => {
        let resolveCheckIn: (value: unknown) => void;
        (checkInApi as Mock).mockReturnValue(
            new Promise(resolve => {
                resolveCheckIn = resolve;
            })
        );

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.handleCheckIn();
        });

        await waitFor(() => expect(result.current.checkInLoading).toBe(true));

        await act(async () => {
            resolveCheckIn(todayRecord);
        });

        await waitFor(() => expect(result.current.checkInLoading).toBe(false));
    });

    it('dispatches an error toast with the API message when check-in fails', async () => {
        (checkInApi as Mock).mockRejectedValueOnce({
            response: { data: { message: 'Check-in window closed' } },
        });

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleCheckIn();
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Check-in window closed', variant: 'error' })
        );
        expect(result.current.checkInLoading).toBe(false);
    });

    it('dispatches a generic error toast when check-in fails without a response message', async () => {
        (checkInApi as Mock).mockRejectedValueOnce(new Error('network down'));

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleCheckIn();
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Something went wrong.', variant: 'error' })
        );
    });

    it('checks out successfully and reloads the dashboard data', async () => {
        (checkOutApi as Mock).mockResolvedValueOnce(todayRecord);

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getEmployeeProfile).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.handleCheckOut();
        });

        expect(checkOutApi).toHaveBeenCalledWith({ userType: 'employee', userId: 42 }, {});
        expect(result.current.checkOutLoading).toBe(false);
        expect(dispatchMock).not.toHaveBeenCalled();
        expect(getEmployeeProfile).toHaveBeenCalledTimes(2);
    });

    it('sets checkOutLoading while the check-out request is in flight', async () => {
        let resolveCheckOut: (value: unknown) => void;
        (checkOutApi as Mock).mockReturnValue(
            new Promise(resolve => {
                resolveCheckOut = resolve;
            })
        );

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        act(() => {
            result.current.handleCheckOut();
        });

        await waitFor(() => expect(result.current.checkOutLoading).toBe(true));

        await act(async () => {
            resolveCheckOut(todayRecord);
        });

        await waitFor(() => expect(result.current.checkOutLoading).toBe(false));
    });

    it('dispatches an error toast with the API message when check-out fails', async () => {
        (checkOutApi as Mock).mockRejectedValueOnce({
            response: { data: { message: 'Already checked out' } },
        });

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleCheckOut();
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Already checked out', variant: 'error' })
        );
        expect(result.current.checkOutLoading).toBe(false);
    });

    it('dispatches a generic error toast when check-out fails without a response message', async () => {
        (checkOutApi as Mock).mockRejectedValueOnce(new Error('network down'));

        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleCheckOut();
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Something went wrong.', variant: 'error' })
        );
    });

    it('exposes reload to manually refetch the dashboard data', async () => {
        const { result } = renderHook(() => useEmployeeDashboard());
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getEmployeeProfile).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.reload();
        });

        expect(getEmployeeProfile).toHaveBeenCalledTimes(2);
    });
});
