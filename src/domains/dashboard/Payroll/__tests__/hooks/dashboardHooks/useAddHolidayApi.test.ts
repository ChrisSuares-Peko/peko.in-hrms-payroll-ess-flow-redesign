import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { holiday } from '../../../api/dashBoardIndex';
import { useAddHoliday } from '../../../hooks/dashboardHooks/useAddHolidayApi';
import { invalidateDashboardCache } from '../../../hooks/dashboardHooks/useDashboardApi';

vi.mock('../../../api/dashBoardIndex', () => ({
    holiday: vi.fn(),
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

describe('useAddHoliday', () => {
    it('calls holiday with merged userId/userType payload and returns true on success', async () => {
        const mockData = { id: 'evt-1', title: 'Diwali' };
        (holiday as Mock).mockResolvedValueOnce(mockData);

        const { result } = renderHook(() => useAddHoliday());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.addHoliday({
                title: 'Diwali',
                isAllDay: true,
                start: '2026-11-08',
                end: '2026-11-08',
                category: 'Festival',
                sendPriorEmailDate: '2026-11-01',
                isEmailSent: false,
            } as any);
        });

        expect(holiday).toHaveBeenCalledWith({
            title: 'Diwali',
            isAllDay: true,
            start: '2026-11-08',
            end: '2026-11-08',
            category: 'Festival',
            sendPriorEmailDate: '2026-11-01',
            isEmailSent: false,
            userId: 1,
            userType: 'merchant',
        });
        expect(returnValue).toBe(true);
    });

    it('calls invalidateDashboardCache on successful response', async () => {
        (holiday as Mock).mockResolvedValueOnce({ id: 'evt-1' });

        const { result } = renderHook(() => useAddHoliday());

        await act(async () => {
            await result.current.addHoliday({ title: 'Diwali' } as any);
        });

        expect(invalidateDashboardCache).toHaveBeenCalledTimes(1);
    });

    it('does not call invalidateDashboardCache and returns false on failure', async () => {
        (holiday as Mock).mockResolvedValueOnce(false);

        const { result } = renderHook(() => useAddHoliday());

        let returnValue: any;
        await act(async () => {
            returnValue = await result.current.addHoliday({ title: 'Diwali' } as any);
        });

        expect(invalidateDashboardCache).not.toHaveBeenCalled();
        expect(returnValue).toBe(false);
    });

    it('toggles isLoading true during the call and false after', async () => {
        let resolveApi: (v: any) => void;
        (holiday as Mock).mockReturnValue(new Promise(r => { resolveApi = r; }));

        const { result } = renderHook(() => useAddHoliday());

        act(() => {
            result.current.addHoliday({ title: 'Diwali' } as any);
        });

        expect(result.current.isLoading).toBe(true);

        await act(async () => { resolveApi({ id: 'evt-1' }); });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
});
