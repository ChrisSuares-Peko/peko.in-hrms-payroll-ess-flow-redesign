import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { saveKybBusinessType } from '../../../api/admin/kybStatusApi';
import { useSaveBusinessType } from '../../../hooks/admin/useSaveBusinessType';
import { setBusinessType, setKybStage } from '../../../slices/corporateCardsSlice';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'SHOW_TOAST', payload })),
}));

vi.mock('../../../api/admin/kybStatusApi', () => ({
    saveKybBusinessType: vi.fn(),
}));

vi.mock('../../../slices/corporateCardsSlice', () => ({
    setKybStage: vi.fn((stage: string) => ({ type: 'SET_KYB_STAGE', payload: stage })),
    setBusinessType: vi.fn((type: string) => ({ type: 'SET_BUSINESS_TYPE', payload: type })),
}));

const mockDispatch = vi.fn();

describe('useSaveBusinessType', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: { role: 'admin', id: 5 } } })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    });

    it('starts with saveLoading=false', () => {
        const { result } = renderHook(() => useSaveBusinessType());
        expect(result.current.saveLoading).toBe(false);
    });

    it('persists the business type before moving on, so a refresh lands back on the upload step', async () => {
        (saveKybBusinessType as Mock).mockResolvedValue({ status: true });
        const { result } = renderHook(() => useSaveBusinessType());

        await result.current.handleSaveBusinessType('LLP');

        expect(saveKybBusinessType).toHaveBeenCalledWith('admin', 5, 'LLP');
        expect(setBusinessType).toHaveBeenCalledWith('LLP');
        expect(setKybStage).toHaveBeenCalledWith('upload');
    });

    it('stays on the current step when the business type could not be saved', async () => {
        (saveKybBusinessType as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useSaveBusinessType());

        await result.current.handleSaveBusinessType('LLP');

        expect(setKybStage).not.toHaveBeenCalled();
        expect(setBusinessType).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'error' }));
    });

    it('reports the request in flight', async () => {
        (saveKybBusinessType as Mock).mockImplementation(() => new Promise(() => {}));
        const { result } = renderHook(() => useSaveBusinessType());

        result.current.handleSaveBusinessType('LLP');

        await waitFor(() => expect(result.current.saveLoading).toBe(true));
    });
});
