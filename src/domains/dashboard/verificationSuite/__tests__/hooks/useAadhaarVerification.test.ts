import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { generateAadhaarLink, getAadhaarDetails } from '../../api';
import useAadhaarVerification from '../../hooks/useAadhaarVerification';

vi.mock('../../api', () => ({
    generateAadhaarLink: vi.fn(),
    getAadhaarDetails: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: '123', role: 'corporate' },
            },
        }),
}));

describe('useAadhaarVerification Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('generateLink', () => {
        it('returns the link/reference/transaction ids on success', async () => {
            (generateAadhaarLink as any).mockResolvedValue({
                status: true,
                data: { link: 'https://digilocker', referenceNumber: 'REF1', transactionId: 'TXN1' },
            });

            const { result } = renderHook(() => useAadhaarVerification());

            let linkData: any;
            await act(async () => {
                linkData = await result.current.generateLink({ name: 'Test User' });
            });

            expect(generateAadhaarLink).toHaveBeenCalledWith({
                userId: '123',
                userType: 'corporate',
                values: { name: 'Test User' },
            });
            expect(linkData).toEqual({
                link: 'https://digilocker',
                reference_number: 'REF1',
                transaction_id: 'TXN1',
            });
            expect(result.current.isGeneratingLink).toBe(false);
        });

        it('returns false when the API responds without success', async () => {
            (generateAadhaarLink as any).mockResolvedValue({ status: false });

            const { result } = renderHook(() => useAadhaarVerification());

            let linkData: any;
            await act(async () => {
                linkData = await result.current.generateLink({});
            });

            expect(linkData).toBe(false);
        });
    });

    describe('startPolling', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it('calls onSuccess as soon as the status resolves to success', async () => {
            (getAadhaarDetails as any).mockResolvedValue({
                status: true,
                data: { status: 'success', name: 'Test User' },
            });

            const { result } = renderHook(() => useAadhaarVerification());
            const onSuccess = vi.fn();
            const onFailed = vi.fn();
            const onTimeout = vi.fn();

            act(() => {
                result.current.startPolling('REF1', 'TXN1', { onSuccess, onFailed, onTimeout });
            });

            await act(async () => {
                await vi.advanceTimersByTimeAsync(0);
            });

            expect(onSuccess).toHaveBeenCalledWith({ status: 'success', name: 'Test User' });
            expect(onFailed).not.toHaveBeenCalled();
            expect(result.current.isPolling).toBe(false);
        });

        it('calls onFailed when the status resolves to failed', async () => {
            (getAadhaarDetails as any).mockResolvedValue({
                status: true,
                data: { status: 'failed' },
            });

            const { result } = renderHook(() => useAadhaarVerification());
            const onSuccess = vi.fn();
            const onFailed = vi.fn();
            const onTimeout = vi.fn();

            act(() => {
                result.current.startPolling('REF1', 'TXN1', { onSuccess, onFailed, onTimeout });
            });

            await act(async () => {
                await vi.advanceTimersByTimeAsync(0);
            });

            expect(onFailed).toHaveBeenCalled();
            expect(onSuccess).not.toHaveBeenCalled();
        });

        it('calls onFailed after 3 consecutive polling errors', async () => {
            (getAadhaarDetails as any).mockResolvedValue(false);

            const { result } = renderHook(() => useAadhaarVerification());
            const onSuccess = vi.fn();
            const onFailed = vi.fn();
            const onTimeout = vi.fn();

            act(() => {
                result.current.startPolling('REF1', 'TXN1', { onSuccess, onFailed, onTimeout });
            });

            // Initial tick + 2 interval ticks (5s apart) = 3 consecutive errors.
            await act(async () => {
                await vi.advanceTimersByTimeAsync(0);
            });
            await act(async () => {
                await vi.advanceTimersByTimeAsync(5000);
            });
            await act(async () => {
                await vi.advanceTimersByTimeAsync(5000);
            });

            expect(onFailed).toHaveBeenCalled();
        });

        it('calls onTimeout once the poll deadline has passed', async () => {
            (getAadhaarDetails as any).mockResolvedValue({
                status: true,
                data: { status: 'pending' },
            });

            const { result } = renderHook(() => useAadhaarVerification());
            const onSuccess = vi.fn();
            const onFailed = vi.fn();
            const onTimeout = vi.fn();

            act(() => {
                result.current.startPolling('REF1', 'TXN1', { onSuccess, onFailed, onTimeout });
            });

            await act(async () => {
                await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 5000);
            });

            expect(onTimeout).toHaveBeenCalled();
            expect(onFailed).not.toHaveBeenCalled();
        });
    });

    it('stopPolling clears an in-progress poll', async () => {
        vi.useFakeTimers();
        (getAadhaarDetails as any).mockResolvedValue({
            status: true,
            data: { status: 'pending' },
        });

        const { result } = renderHook(() => useAadhaarVerification());
        const onSuccess = vi.fn();
        const onFailed = vi.fn();
        const onTimeout = vi.fn();

        act(() => {
            result.current.startPolling('REF1', 'TXN1', { onSuccess, onFailed, onTimeout });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });

        act(() => {
            result.current.stopPolling();
        });

        expect(result.current.isPolling).toBe(false);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(3 * 60 * 1000 + 5000);
        });

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailed).not.toHaveBeenCalled();
        expect(onTimeout).not.toHaveBeenCalled();
    });
});
