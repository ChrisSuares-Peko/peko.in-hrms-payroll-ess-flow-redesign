import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getAttendanceList } from '../../api/attendance';
import { useAttendance } from '../../hooks/useAttendance';

vi.mock('../../api/attendance', () => ({
    getAttendanceList: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 7, role: 'employee' })),
    useAppDispatch: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useAttendance', () => {
    it('starts with an empty records array and does not fetch automatically', () => {
        const { result } = renderHook(() => useAttendance());

        expect(result.current.records).toEqual([]);
        expect(getAttendanceList).not.toHaveBeenCalled();
    });

    it('fetches attendance with the scope, date range and a limit of 100', async () => {
        (getAttendanceList as Mock).mockResolvedValueOnce({ records: [], total: 0 });

        const { result } = renderHook(() => useAttendance());

        await act(async () => {
            await result.current.fetchAttendance({ from: '2024-03-01', to: '2024-03-31' });
        });

        expect(getAttendanceList).toHaveBeenCalledWith(
            { userType: 'employee', userId: 7 },
            { from: '2024-03-01', to: '2024-03-31', limit: 100 }
        );
    });

    it('fetches attendance without from/to filters when not provided', async () => {
        (getAttendanceList as Mock).mockResolvedValueOnce({ records: [], total: 0 });

        const { result } = renderHook(() => useAttendance());

        await act(async () => {
            await result.current.fetchAttendance({});
        });

        expect(getAttendanceList).toHaveBeenCalledWith(
            { userType: 'employee', userId: 7 },
            { from: undefined, to: undefined, limit: 100 }
        );
    });

    it('maps API records to UI rows with formatted dates, times, hours and status', async () => {
        const record = {
            _id: 'a1',
            date: '2024-03-15T12:00:00.000Z',
            checkIn: { time: '2024-03-15T09:05:00.000Z' },
            checkOut: { time: '2024-03-15T18:00:00.000Z' },
            status: 'late' as const,
            totalHours: 8.5,
        };
        (getAttendanceList as Mock).mockResolvedValueOnce({ records: [record], total: 1 });

        const { result } = renderHook(() => useAttendance());

        await act(async () => {
            await result.current.fetchAttendance({});
        });

        await waitFor(() => expect(result.current.records).toHaveLength(1));

        expect(result.current.records[0]).toEqual({
            key: 'a1',
            date: dayjs(record.date).format('ddd MMM D'),
            rawDate: dayjs(record.date).format('YYYY-MM-DD'),
            checkIn: dayjs(record.checkIn.time).format('HH:mm'),
            checkOut: dayjs(record.checkOut.time).format('HH:mm'),
            hours: '8h 30m',
            status: 'Late',
            isLate: true,
        });
    });

    it('maps missing checkIn/checkOut times to null and non-late status to isLate: false', async () => {
        const record = {
            _id: 'a2',
            date: '2024-03-16T12:00:00.000Z',
            status: 'absent' as const,
        };
        (getAttendanceList as Mock).mockResolvedValueOnce({ records: [record], total: 1 });

        const { result } = renderHook(() => useAttendance());

        await act(async () => {
            await result.current.fetchAttendance({});
        });

        await waitFor(() => expect(result.current.records).toHaveLength(1));

        expect(result.current.records[0]).toMatchObject({
            checkIn: null,
            checkOut: null,
            hours: null,
            status: 'Absent',
            isLate: false,
        });
    });

    it.each([
        ['present', 'Present'],
        ['late', 'Late'],
        ['absent', 'Absent'],
        ['on-leave', 'Leave'],
        ['half-day', 'Half Day'],
    ] as const)('maps API status %s to UI status %s', async (apiStatus, uiStatus) => {
        const record = {
            _id: `s-${apiStatus}`,
            date: '2024-03-17T12:00:00.000Z',
            status: apiStatus,
        };
        (getAttendanceList as Mock).mockResolvedValueOnce({ records: [record], total: 1 });

        const { result } = renderHook(() => useAttendance());

        await act(async () => {
            await result.current.fetchAttendance({});
        });

        await waitFor(() => expect(result.current.records).toHaveLength(1));
        expect(result.current.records[0].status).toBe(uiStatus);
    });

    it('replaces previous records on a subsequent fetch', async () => {
        (getAttendanceList as Mock)
            .mockResolvedValueOnce({
                records: [{ _id: 'a1', date: '2024-03-15T12:00:00.000Z', status: 'present' as const }],
                total: 1,
            })
            .mockResolvedValueOnce({
                records: [{ _id: 'a2', date: '2024-03-16T12:00:00.000Z', status: 'late' as const }],
                total: 1,
            });

        const { result } = renderHook(() => useAttendance());

        await act(async () => {
            await result.current.fetchAttendance({});
        });
        await waitFor(() => expect(result.current.records[0]?.key).toBe('a1'));

        await act(async () => {
            await result.current.fetchAttendance({});
        });
        await waitFor(() => expect(result.current.records[0]?.key).toBe('a2'));

        expect(result.current.records).toHaveLength(1);
    });
});
