import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import useUpiCollect from '../../../hooks/collectPayment/useUpiCollect';

vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    return {
        ...actual,
        message: {
            ...actual.message,
            success: vi.fn(),
        },
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useUpiCollect', () => {
    it('sendUpiRequest returns pending data with parsed expiry minutes', async () => {
        const { result } = renderHook(() => useUpiCollect());

        let returned: any;
        await act(async () => {
            returned = await result.current.sendUpiRequest({
                amount: '500',
                upiId: 'user@upi',
                requestExpiry: '15',
            } as any);
        });

        expect(returned).toEqual({
            amount: '500',
            upiId: 'user@upi',
            expiryMinutes: 15,
        });
    });

    it('cancelRequest resolves cleanly', async () => {
        const { result } = renderHook(() => useUpiCollect());

        await act(async () => {
            await expect(result.current.cancelRequest()).resolves.toBeUndefined();
        });
    });

    it('sendReminder shows antd success message', async () => {
        const { message } = await import('antd');
        const { result } = renderHook(() => useUpiCollect());

        await act(async () => {
            await result.current.sendReminder();
        });

        expect(message.success).toHaveBeenCalledWith('Reminder sent to customer');
    });

    it('retryPayment resolves cleanly', async () => {
        const { result } = renderHook(() => useUpiCollect());

        await act(async () => {
            await expect(result.current.retryPayment()).resolves.toBeUndefined();
        });
    });

    it('pollPaymentStatus returns success data with the same amount', async () => {
        const { result } = renderHook(() => useUpiCollect());

        let returned: any;
        await act(async () => {
            returned = await result.current.pollPaymentStatus('250');
        });

            expect(returned.amount).toBe('250');
            expect(typeof returned.referenceId).toBe('string');
            expect(returned.referenceId.startsWith('TXN')).toBe(true);
            expect(typeof returned.dateTime).toBe('string');
        },
        15000
    );
});
