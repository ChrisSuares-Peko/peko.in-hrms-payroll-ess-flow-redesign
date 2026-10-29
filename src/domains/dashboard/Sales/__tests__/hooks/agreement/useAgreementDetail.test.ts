import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAgreementByIdApi } from '../../../api/agreements';
import useAgreementDetail from '../../../hooks/agreement/useAgreementDetail';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/agreements', () => ({
    getAgreementByIdApi: vi.fn(),
    getAgreementDocumentApi: vi.fn(() => Promise.resolve(false)),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useAgreementDetail', () => {
    it('does not call API when agreementId is undefined', async () => {
        const { result } = renderHook(() => useAgreementDetail(undefined));

        // Allow any pending microtasks to flush.
        await waitFor(() => {
            expect(getAgreementByIdApi).not.toHaveBeenCalled();
        });
        expect(result.current.agreement).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('fetches and sets agreement on success', async () => {
        const detail = { id: 'a-1', title: 'Hello' };
        (getAgreementByIdApi as any).mockResolvedValueOnce({ status: true, data: detail });

        const { result } = renderHook(() => useAgreementDetail('a-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(getAgreementByIdApi).toHaveBeenCalledWith('a-1', {
            userId: 'u',
            userType: 'merchant',
        });
        expect(result.current.agreement).toEqual(detail);
    });

    it('shows error toast on status false', async () => {
        (getAgreementByIdApi as any).mockResolvedValueOnce({ status: false, message: 'no' });

        const { result } = renderHook(() => useAgreementDetail('a-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(showToast).toHaveBeenCalledWith({ description: 'no', variant: 'error' });
        expect(result.current.agreement).toBeNull();
    });

    it('refetch triggers another API call', async () => {
        (getAgreementByIdApi as any).mockResolvedValue({ status: true, data: { id: 'a-1' } });

        const { result } = renderHook(() => useAgreementDetail('a-1'));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getAgreementByIdApi).toHaveBeenCalledTimes(1);

        await result.current.refetch();
        expect(getAgreementByIdApi).toHaveBeenCalledTimes(2);
    });
});
