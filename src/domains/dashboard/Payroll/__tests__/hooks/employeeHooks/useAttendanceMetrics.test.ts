import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { getAttendanceMetrics } from '../../../api/employeeApi';
import { useAttendanceMetrics } from '../../../hooks/employeeHooks/useAttendanceMetrics';

vi.mock('../../../api/employeeApi', () => ({
    getAttendanceMetrics: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: vi.fn(),
}));

const DEFAULT_METRICS = {
    present: 0,
    late: 0,
    absent: 0,
    onLeave: 0,
    otHours: 0,
    month: { from: '', to: '' },
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useAttendanceMetrics', () => {
    it('returns default metrics while the request is in flight', () => {
        let resolveApi!: (v: any) => void;
        (getAttendanceMetrics as Mock).mockReturnValue(new Promise(r => { resolveApi = r; }));

        const { result } = renderHook(() => useAttendanceMetrics('emp-1', '2026-07'));

        expect(result.current.isLoading).toBe(true);
        expect(result.current.metrics).toEqual(DEFAULT_METRICS);

        resolveApi(DEFAULT_METRICS);
    });

    it('calls getAttendanceMetrics with userType/userId/employeeId/month and sets realistic metrics on success', async () => {
        const mockMetrics = {
            present: 20,
            late: 4,
            absent: 1,
            onLeave: 2,
            otHours: 12.5,
            month: { from: '2026-07-01', to: '2026-07-31' },
        };
        (getAttendanceMetrics as Mock).mockResolvedValueOnce(mockMetrics);

        const { result } = renderHook(() => useAttendanceMetrics('emp-1', '2026-07'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getAttendanceMetrics).toHaveBeenCalledWith({
            userType: 'merchant',
            userId: 1,
            employeeId: 'emp-1',
            month: '2026-07',
        });
        expect(result.current.metrics).toEqual(mockMetrics);
    });

    it('falls back to default metrics when the API returns a falsy value', async () => {
        (getAttendanceMetrics as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useAttendanceMetrics('emp-1', '2026-07'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.metrics).toEqual(DEFAULT_METRICS);
    });

    it('does not call the API when employeeId is empty', () => {
        renderHook(() => useAttendanceMetrics('', '2026-07'));

        expect(getAttendanceMetrics).not.toHaveBeenCalled();
    });

    it('refetches metrics when refetch is called', async () => {
        const firstMetrics = { ...DEFAULT_METRICS, present: 10 };
        const secondMetrics = { ...DEFAULT_METRICS, present: 15 };
        (getAttendanceMetrics as Mock)
            .mockResolvedValueOnce(firstMetrics)
            .mockResolvedValueOnce(secondMetrics);

        const { result } = renderHook(() => useAttendanceMetrics('emp-1', '2026-07'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.metrics).toEqual(firstMetrics);

        await act(async () => {
            await result.current.refetch();
        });

        expect(getAttendanceMetrics).toHaveBeenCalledTimes(2);
        expect(result.current.metrics).toEqual(secondMetrics);
    });

    it('re-fetches when the month parameter changes', async () => {
        (getAttendanceMetrics as Mock).mockResolvedValue(DEFAULT_METRICS);

        const { rerender } = renderHook(
            ({ month }) => useAttendanceMetrics('emp-1', month),
            { initialProps: { month: '2026-07' } }
        );

        await act(async () => {});

        rerender({ month: '2026-08' });

        await act(async () => {});

        expect(getAttendanceMetrics).toHaveBeenCalledTimes(2);
        expect(getAttendanceMetrics).toHaveBeenLastCalledWith({
            userType: 'merchant',
            userId: 1,
            employeeId: 'emp-1',
            month: '2026-08',
        });
    });
});
