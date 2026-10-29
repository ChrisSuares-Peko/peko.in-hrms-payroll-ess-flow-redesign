import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createNupayPaymentLinkApi } from '../../../api/collectPayment';
import useSendPaymentLink from '../../../hooks/collectPayment/useSendPaymentLink';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/collectPayment', () => ({
    createNupayPaymentLinkApi: vi.fn(),
}));

const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useSendPaymentLink', () => {
    it('calls the API and onSuccess with the payment link + NuPay expiry', async () => {
        (createNupayPaymentLinkApi as any).mockResolvedValueOnce({
            status: true,
            data: { paymentLink: 'https://peko.in/p/abc', expiresAt: '2026-08-05T06:00:00.000Z' },
        });
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useSendPaymentLink('doc-1'));

        await act(async () => {
            await result.current.generatePaymentLink(
                { amount: '500', customerName: 'Acme', customerPhone: '9876543210' } as any,
                onSuccess
            );
        });

        expect(createNupayPaymentLinkApi).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            amount: '500',
            customerName: 'Acme',
            customerPhone: '9876543210',
            invoiceId: 'doc-1',
        });
        expect(onSuccess).toHaveBeenCalledWith(
            expect.any(Object),
            'https://peko.in/p/abc',
            '2026-08-05T06:00:00.000Z'
        );
    });

    it('shows API error message and skips onSuccess on failure', async () => {
        (createNupayPaymentLinkApi as any).mockResolvedValueOnce({ status: false, message: 'bad' });
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useSendPaymentLink('doc-1'));

        await act(async () => {
            await result.current.generatePaymentLink({ amount: '1' } as any, onSuccess);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'bad', variant: 'error' });
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('shows fallback error when API returns falsy', async () => {
        (createNupayPaymentLinkApi as any).mockResolvedValueOnce(null);

        const { result } = renderHook(() => useSendPaymentLink('doc-1'));

        await act(async () => {
            await result.current.generatePaymentLink({ amount: '1' } as any, vi.fn());
        });

        expect(showToast).toHaveBeenCalledWith({
            description: 'Failed to create payment link.',
            variant: 'error',
        });
    });

    it('omits empty customer fields', async () => {
        (createNupayPaymentLinkApi as any).mockResolvedValueOnce({
            status: true,
            data: { paymentLink: 'x' },
        });

        const { result } = renderHook(() => useSendPaymentLink('doc-1'));

        await act(async () => {
            await result.current.generatePaymentLink(
                { amount: '1', customerName: '', customerPhone: '' } as any,
                vi.fn()
            );
        });

        expect(createNupayPaymentLinkApi).toHaveBeenCalledWith(
            expect.objectContaining({ customerName: undefined, customerPhone: undefined })
        );
    });
});
