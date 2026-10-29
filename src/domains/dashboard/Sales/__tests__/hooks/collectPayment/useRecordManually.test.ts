import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { recordManualPaymentApi } from '../../../api/collectPayment';
import useRecordManually from '../../../hooks/collectPayment/useRecordManually';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(payload => ({ type: 'apiSlice/showToast', payload })),
}));
vi.mock('../../../api/collectPayment', () => ({
    recordManualPaymentApi: vi.fn(),
}));

const mockDispatch = vi.fn();

const formValues: any = {
    amountPaid: '500',
    paymentMethod: 'Cash',
    paymentDate: '2026-01-01',
    referenceId: 'REF-1',
    notes: 'partial',
};

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (useAppDispatch as any).mockReturnValue(mockDispatch);
});

describe('useRecordManually', () => {
    it('does nothing when invoiceId is missing', async () => {
        const onSuccess = vi.fn();
        const { result } = renderHook(() => useRecordManually(undefined));

        await act(async () => {
            await result.current.savePayment(formValues, onSuccess);
        });

        expect(recordManualPaymentApi).not.toHaveBeenCalled();
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('shows success toast and calls onSuccess on status true', async () => {
        (recordManualPaymentApi as any).mockResolvedValueOnce({ status: true });
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useRecordManually('inv-1'));

        await act(async () => {
            await result.current.savePayment(formValues, onSuccess);
        });

        expect(recordManualPaymentApi).toHaveBeenCalledWith({
            userId: 'u',
            userType: 'merchant',
            invoiceId: 'inv-1',
            amount: 500,
            paymentMethod: 'Cash',
            paymentDate: '2026-01-01',
            referenceId: 'REF-1',
            notes: 'partial',
        });
        expect(showToast).toHaveBeenCalledWith({
            description: 'Payment recorded successfully.',
            variant: 'success',
        });
        expect(onSuccess).toHaveBeenCalled();
    });

    it('shows API error message on status false and skips onSuccess', async () => {
        (recordManualPaymentApi as any).mockResolvedValueOnce({ status: false, message: 'bad' });
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useRecordManually('inv-1'));

        await act(async () => {
            await result.current.savePayment(formValues, onSuccess);
        });

        expect(showToast).toHaveBeenCalledWith({ description: 'bad', variant: 'error' });
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('omits referenceId/notes when empty', async () => {
        (recordManualPaymentApi as any).mockResolvedValueOnce({ status: true });

        const { result } = renderHook(() => useRecordManually('inv-1'));

        await act(async () => {
            await result.current.savePayment(
                {
                    ...formValues,
                    referenceId: '',
                    notes: '',
                    paymentDate: undefined,
                } as any,
                vi.fn()
            );
        });

        expect(recordManualPaymentApi).toHaveBeenCalledWith(
            expect.objectContaining({
                referenceId: undefined,
                notes: undefined,
                paymentDate: '',
            })
        );
    });
});
