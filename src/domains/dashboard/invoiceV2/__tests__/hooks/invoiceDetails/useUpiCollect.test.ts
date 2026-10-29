import { renderHook, act } from '@testing-library/react';
import { message } from 'antd';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import useUpiCollect from '../../../hooks/invoiceDetails/useUpiCollect';

vi.mock('antd', async () => {
    const actual: any = await vi.importActual('antd');
    return { ...actual, message: { success: vi.fn() } };
});

describe('useUpiCollect (invoiceDetails)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sendUpiRequest resolves to pending data', async () => {
        const { result } = renderHook(() => useUpiCollect());

        const promise = result.current.sendUpiRequest({
            amount: '100',
            upiId: 'a@upi',
            requestExpiry: '5',
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
        });

        const res = await promise;
        expect(res).toEqual({ amount: '100', upiId: 'a@upi', expiryMinutes: 5 });
    });

    it('cancelRequest resolves after delay', async () => {
        const { result } = renderHook(() => useUpiCollect());
        const promise = result.current.cancelRequest();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
        });

        await expect(promise).resolves.toBeUndefined();
    });

    it('sendReminder triggers success message', async () => {
        const { result } = renderHook(() => useUpiCollect());
        const promise = result.current.sendReminder();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(800);
        });

        await promise;
        expect(message.success).toHaveBeenCalledWith('Reminder sent to customer');
    });

    it('pollPaymentStatus resolves with success data', async () => {
        const { result } = renderHook(() => useUpiCollect());
        const promise = result.current.pollPaymentStatus('200');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(8000);
        });

        const res = await promise;
        expect(res.amount).toBe('200');
        expect(res.referenceId).toMatch(/^TXN/);
    });
});
