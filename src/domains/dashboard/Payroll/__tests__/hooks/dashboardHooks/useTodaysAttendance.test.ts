import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getTodayAttendanceCounts } from '../../../api/dashBoardIndex';
import { useTodaysAttendance } from '../../../hooks/dashboardHooks/useTodaysAttendance';

vi.mock('../../../api/dashBoardIndex', () => ({
    getTodayAttendanceCounts: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useTodaysAttendance', () => {
    it('starts with isLoading true and default zeroed counts while loading', () => {
        let resolveApi!: (v: any) => void;
        (getTodayAttendanceCounts as Mock).mockReturnValue(new Promise(r => { resolveApi = r; }));

        const { result } = renderHook(() => useTodaysAttendance());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.counts).toEqual({ present: 0, late: 0, absent: 0, onLeave: 0 });

        // avoid unresolved promise warnings across tests
        resolveApi({ present: 0, late: 0, absent: 0, onLeave: 0 });
    });

    it('calls getTodayAttendanceCounts with userId/userType and sets counts on success', async () => {
        const mockCounts = { present: 42, late: 3, absent: 5, onLeave: 2 };
        (getTodayAttendanceCounts as Mock).mockResolvedValueOnce(mockCounts);

        const { result } = renderHook(() => useTodaysAttendance());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getTodayAttendanceCounts).toHaveBeenCalledWith({ userId: 1, userType: 'merchant' });
        expect(result.current.counts).toEqual(mockCounts);
    });

    it('falls back to default counts when the API returns a falsy value', async () => {
        (getTodayAttendanceCounts as Mock).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useTodaysAttendance());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.counts).toEqual({ present: 0, late: 0, absent: 0, onLeave: 0 });
    });
});
