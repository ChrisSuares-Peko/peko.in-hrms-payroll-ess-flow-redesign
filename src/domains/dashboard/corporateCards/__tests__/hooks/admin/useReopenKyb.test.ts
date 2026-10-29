import { act, renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { reopenKyb } from '../../../api/admin/kybStatusApi';
import { useReopenKyb } from '../../../hooks/admin/useReopenKyb';
import { setKybStage } from '../../../slices/corporateCardsSlice';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'SHOW_TOAST', payload })),
}));

vi.mock('../../../api/admin/kybStatusApi', () => ({
    reopenKyb: vi.fn(),
}));

vi.mock('../../../slices/corporateCardsSlice', () => ({
    setKybStage: vi.fn((stage: string) => ({ type: 'SET_KYB_STAGE', payload: stage })),
}));

const mockDispatch = vi.fn();

describe('useReopenKyb', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({
                reducer: {
                    auth: { role: 'admin', id: 5 },
                    corporateCards: { businessType: 'PRIVATE_LIMITED' },
                },
            })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (reopenKyb as Mock).mockResolvedValue({ status: true, data: { application: {} } });
    });

    it('starts idle', () => {
        expect(renderHook(() => useReopenKyb()).result.current.reopenLoading).toBe(false);
    });

    /**
     * Recording it server-side is the whole point: without it a reload mid-resubmission resolves the stage
     * from a still-REJECTED application and strands the corporate back on the rejection screen.
     */
    it('records the reopen before moving the corporate on', async () => {
        const { result } = renderHook(() => useReopenKyb());

        await act(async () => {
            await result.current.handleReopen();
        });

        expect(reopenKyb).toHaveBeenCalledWith('admin', 5);
        expect(setKybStage).toHaveBeenCalledWith('upload');
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_KYB_STAGE',
            payload: 'upload',
        });
    });

    /**
     * resolveStage derives 'upload' from the same stored application, so landing anywhere else here would
     * mean the click and the next refresh disagree.
     */
    it('lands where resolveStage would for the same state', async () => {
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({
                reducer: {
                    auth: { role: 'admin', id: 5 },
                    corporateCards: { businessType: null },
                },
            })
        );
        const { result } = renderHook(() => useReopenKyb());

        await act(async () => {
            await result.current.handleReopen();
        });

        expect(setKybStage).toHaveBeenCalledWith('initiate');
    });

    it('keeps the corporate on the rejection screen when the call fails', async () => {
        (reopenKyb as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useReopenKyb());

        await act(async () => {
            await result.current.handleReopen();
        });

        expect(setKybStage).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
    });

    it('clears the loading flag either way', async () => {
        (reopenKyb as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useReopenKyb());

        await act(async () => {
            await result.current.handleReopen();
        });

        await waitFor(() => expect(result.current.reopenLoading).toBe(false));
    });
});
