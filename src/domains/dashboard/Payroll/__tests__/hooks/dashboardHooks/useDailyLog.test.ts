import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getDailyAttendanceLog } from '../../../api/dashBoardIndex';
import { useDailyLog } from '../../../hooks/dashboardHooks/useDailyLog';

vi.mock('../../../api/dashBoardIndex', () => ({
    getDailyAttendanceLog: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: vi.fn(),
}));

const DEFAULT_PAGINATION = { total: 0, page: 1, limit: 30, totalPages: 0 };

const mockEntry = {
    _id: 'log-1',
    employee: {
        _id: 'emp-1',
        employeeId: 'EMP001',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        profileImage: null,
        designation: 'Engineer',
        shift: 'Day Shift',
    },
    date: '2026-07-15T00:00:00.000Z',
    checkIn: '2026-07-15T09:05:00.000Z',
    checkOut: '2026-07-15T18:10:00.000Z',
    lateMinutes: 5,
    totalHours: 9.25,
    otHours: 1.5,
    status: 'late',
    notes: null,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useDailyLog', () => {
    it('starts with default rows/pagination while loading', () => {
        let resolveApi!: (v: any) => void;
        (getDailyAttendanceLog as Mock).mockReturnValue(new Promise(r => { resolveApi = r; }));

        const { result } = renderHook(() => useDailyLog({ page: 1 }));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.rows).toEqual([]);
        expect(result.current.pagination).toEqual(DEFAULT_PAGINATION);

        resolveApi({ entries: [], pagination: DEFAULT_PAGINATION });
    });

    it('calls getDailyAttendanceLog with userType/userId, filters and a fixed limit of 30', async () => {
        (getDailyAttendanceLog as Mock).mockResolvedValueOnce({
            entries: [mockEntry],
            pagination: { total: 1, page: 2, limit: 30, totalPages: 1 },
        });

        const { result } = renderHook(() =>
            useDailyLog({
                from: '2026-07-01',
                to: '2026-07-31',
                search: 'jane',
                status: 'late',
                employee: 'emp-1',
                page: 2,
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getDailyAttendanceLog).toHaveBeenCalledWith({
            userType: 'merchant',
            userId: 1,
            from: '2026-07-01',
            to: '2026-07-31',
            search: 'jane',
            status: 'late',
            employee: 'emp-1',
            page: 2,
            limit: 30,
        });
    });

    it('maps API entries into timesheet rows and sets pagination on success', async () => {
        (getDailyAttendanceLog as Mock).mockResolvedValueOnce({
            entries: [mockEntry],
            pagination: { total: 1, page: 1, limit: 30, totalPages: 1 },
        });

        const { result } = renderHook(() => useDailyLog({ page: 1 }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.rows).toHaveLength(1);
        expect(result.current.rows[0]).toMatchObject({
            key: 'log-1',
            employeeId: 'emp-1',
            name: 'Jane Doe',
            email: 'jane@example.com',
            initials: 'JD',
            shift: 'Day Shift',
            status: 'Late',
            rawStatus: 'late',
            lateMinutes: 5,
        });
        expect(result.current.pagination).toEqual({ total: 1, page: 1, limit: 30, totalPages: 1 });
    });

    it('resets rows and pagination to defaults when the API call fails', async () => {
        (getDailyAttendanceLog as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useDailyLog({ page: 1 }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.rows).toEqual([]);
        expect(result.current.pagination).toEqual(DEFAULT_PAGINATION);
    });

    it('re-fetches when the page filter changes', async () => {
        (getDailyAttendanceLog as Mock).mockResolvedValue({
            entries: [],
            pagination: DEFAULT_PAGINATION,
        });

        const { rerender } = renderHook(
            ({ page }) => useDailyLog({ page }),
            { initialProps: { page: 1 } }
        );

        await act(async () => {});

        rerender({ page: 2 });

        await act(async () => {});

        expect(getDailyAttendanceLog).toHaveBeenCalledTimes(2);
        expect(getDailyAttendanceLog).toHaveBeenLastCalledWith(
            expect.objectContaining({ page: 2, limit: 30 })
        );
    });

    it('refetches with the same filters when refetch is called', async () => {
        (getDailyAttendanceLog as Mock).mockResolvedValue({
            entries: [],
            pagination: DEFAULT_PAGINATION,
        });

        const { result } = renderHook(() => useDailyLog({ page: 1 }));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getDailyAttendanceLog).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.refetch();
        });

        expect(getDailyAttendanceLog).toHaveBeenCalledTimes(2);
    });
});
