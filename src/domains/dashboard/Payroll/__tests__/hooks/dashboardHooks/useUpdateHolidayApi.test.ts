import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { holidayUpdate } from '../../../api/dashBoardIndex';
import { invalidateDashboardCache } from '../../../hooks/dashboardHooks/useDashboardApi';
import { useUpdateHoliday } from '../../../hooks/dashboardHooks/useUpdateHolidayApi';

vi.mock('../../../api/dashBoardIndex', () => ({
    holidayUpdate: vi.fn(),
}));

vi.mock('../../../hooks/dashboardHooks/useDashboardApi', () => ({
    invalidateDashboardCache: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 1, role: 'merchant' })),
    useAppDispatch: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useUpdateHoliday', () => {
    it('calls holidayUpdate with merged userId/userType payload and returns true on success', async () => {
        const mockData = { id: 'evt-1', title: 'Diwali Updated' };
        (holidayUpdate as Mock).mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useUpdateHoliday());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.updateHoliday({
                holidayId: 'evt-1',
                title: 'Diwali Updated',
                isAllDay: true,
                start: '2026-11-08',
                end: '2026-11-08',
                category: 'Festival',
                sendPriorEmail: false,
            } as any);
        });

        expect(holidayUpdate).toHaveBeenCalledWith({
            holidayId: 'evt-1',
            title: 'Diwali Updated',
            isAllDay: true,
            start: '2026-11-08',
            end: '2026-11-08',
            category: 'Festival',
            sendPriorEmail: false,
            userId: 1,
            userType: 'merchant',
        });
        expect(returnValue).toBe(true);
    });

    it('calls invalidateDashboardCache on successful response', async () => {
        (holidayUpdate as Mock).mockResolvedValueOnce({ id: 'evt-1' });

        const { result } = renderHook(() => useUpdateHoliday());

        await act(async () => {
            await result.current.updateHoliday({ holidayId: 'evt-1', title: 'x' } as any);
        });

        expect(invalidateDashboardCache).toHaveBeenCalledTimes(1);
    });

    it('does not call invalidateDashboardCache and returns false on failure', async () => {
        (holidayUpdate as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useUpdateHoliday());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.updateHoliday({ holidayId: 'evt-1', title: 'x' } as any);
        });

        expect(invalidateDashboardCache).not.toHaveBeenCalled();
        expect(returnValue).toBe(false);
    });

    it('toggles isLoading true during the call and false after', async () => {
        let resolveApi: (v: any) => void;
        (holidayUpdate as Mock).mockReturnValue(new Promise(r => { resolveApi = r; }));

        const { result } = renderHook(() => useUpdateHoliday());

        act(() => {
            result.current.updateHoliday({ holidayId: 'evt-1', title: 'x' } as any);
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => { resolveApi({ id: 'evt-1' }); });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
