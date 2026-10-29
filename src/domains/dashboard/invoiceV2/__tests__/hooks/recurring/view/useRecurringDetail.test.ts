import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { fetchRecurringScheduleById, updateRecurringStatus } from '../../../../api/recurring';
import { useRecurringDetail } from '../../../../hooks/recurring/view/useRecurringDetail';

vi.mock('../../../../api/recurring', () => ({
    fetchRecurringScheduleById: vi.fn(),
    updateRecurringStatus: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'u1', role: 'CORPORATE' })),
}));

const dispatchMock = vi.fn();
vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('react-redux', () => ({
    useDispatch: () => dispatchMock,
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((x: any) => x),
}));

const mockSchedule = {
    id: 1,
    status: 'ACTIVE',
    sourceInvoice: { name: 'Customer A' },
    frequency: { unit: 'MONTHS', every: 1 },
};

describe('useRecurringDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads schedule on mount when recurringId provided', async () => {
        (fetchRecurringScheduleById as Mock).mockResolvedValue(mockSchedule);

        const { result } = renderHook(() => useRecurringDetail('42'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(fetchRecurringScheduleById).toHaveBeenCalledWith(
            expect.objectContaining({ recurringId: '42' })
        );
        expect(result.current.schedule).toEqual(mockSchedule);
    });

    it('schedule is null and fetch not called when recurringId is null', async () => {
        (fetchRecurringScheduleById as Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useRecurringDetail(null));

        await new Promise(r => setTimeout(r, 50));
        expect(result.current.schedule).toBeNull();
        expect(fetchRecurringScheduleById).not.toHaveBeenCalled();
    });

    it('handlePause calls updateRecurringStatus with status=PAUSED', async () => {
        (fetchRecurringScheduleById as Mock).mockResolvedValue(mockSchedule);
        (updateRecurringStatus as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useRecurringDetail('42'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handlePause();
        });

        expect(updateRecurringStatus).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'PAUSED' })
        );
    });

    it('handleResume calls updateRecurringStatus with status=ACTIVE', async () => {
        (fetchRecurringScheduleById as Mock).mockResolvedValue(mockSchedule);
        (updateRecurringStatus as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useRecurringDetail('42'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleResume();
        });

        expect(updateRecurringStatus).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'ACTIVE' })
        );
    });

    it('handleEnd calls updateRecurringStatus with status=ENDED', async () => {
        (fetchRecurringScheduleById as Mock).mockResolvedValue(mockSchedule);
        (updateRecurringStatus as Mock).mockResolvedValue(true);

        const { result } = renderHook(() => useRecurringDetail('42'));
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            await result.current.handleEnd();
        });

        expect(updateRecurringStatus).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'ENDED' })
        );
    });
});
