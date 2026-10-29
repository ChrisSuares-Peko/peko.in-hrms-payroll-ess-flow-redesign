import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { initiateKycFull } from '../../../api/user/kycApi';
import { useInitiateKycApi } from '../../../hooks/user/useInitiateKycApi';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((opts: any) => ({ type: 'SHOW_TOAST', payload: opts })),
}));

vi.mock('../../../api/user/kycApi', () => ({
    initiateKycFull: vi.fn(),
}));

const mockDispatch = vi.fn();
const mockAuth = { reducer: { auth: { role: 'user', id: 3 } } };

describe('useInitiateKycApi', () => {
    let openSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    });

    it('starts with submitLoading=false', () => {
        const { result } = renderHook(() => useInitiateKycApi());
        expect(result.current.submitLoading).toBe(false);
    });

    it('sets submitLoading=true during the call and false after', async () => {
        let resolve!: (v: any) => void;
        (initiateKycFull as Mock).mockImplementation(
            () =>
                new Promise(r => {
                    resolve = r;
                })
        );

        const { result } = renderHook(() => useInitiateKycApi());
        act(() => {
            result.current.handleInitiateKyc();
        });
        expect(result.current.submitLoading).toBe(true);

        await act(async () => {
            resolve(false);
        });
        expect(result.current.submitLoading).toBe(false);
    });

    it('calls initiateKycFull with role and id', async () => {
        (initiateKycFull as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useInitiateKycApi());

        await act(async () => {
            await result.current.handleInitiateKyc();
        });

        expect(initiateKycFull).toHaveBeenCalledWith('user', 3);
    });

    it('opens the webLink in a new tab on success', async () => {
        (initiateKycFull as Mock).mockResolvedValue({
            data: { kycLink: { webLink: 'https://kyc.example.com/start' } },
        });
        const { result } = renderHook(() => useInitiateKycApi());

        await act(async () => {
            await result.current.handleInitiateKyc();
        });

        expect(openSpy).toHaveBeenCalledWith(
            'https://kyc.example.com/start',
            '_blank',
            'noopener,noreferrer'
        );
    });

    it('does not call window.open when webLink is missing', async () => {
        (initiateKycFull as Mock).mockResolvedValue({ data: { kycLink: {} } });
        const { result } = renderHook(() => useInitiateKycApi());

        await act(async () => {
            await result.current.handleInitiateKyc();
        });

        expect(openSpy).not.toHaveBeenCalled();
    });

    it('surfaces the server message instead of failing silently when no link comes back', async () => {
        (initiateKycFull as Mock).mockResolvedValue({
            message: 'Your KYC is under review.',
            data: { state: 'IN_REVIEW' },
        });
        const { result } = renderHook(() => useInitiateKycApi());

        await act(async () => {
            await result.current.handleInitiateKyc();
        });

        expect(openSpy).not.toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            variant: 'info',
            description: 'Your KYC is under review.',
        });
    });

    it('dispatches showToast error when API returns false', async () => {
        (initiateKycFull as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useInitiateKycApi());

        await act(async () => {
            await result.current.handleInitiateKyc();
        });

        expect(showToast).toHaveBeenCalledWith({
            variant: 'error',
            description: 'Failed to initiate KYC. Please try again.',
        });
        expect(mockDispatch).toHaveBeenCalled();
    });

    it('does not dispatch error toast on success', async () => {
        (initiateKycFull as Mock).mockResolvedValue({
            data: { kycLink: { webLink: 'https://kyc.example.com' } },
        });
        const { result } = renderHook(() => useInitiateKycApi());

        await act(async () => {
            await result.current.handleInitiateKyc();
        });

        expect(showToast).not.toHaveBeenCalled();
    });
});
