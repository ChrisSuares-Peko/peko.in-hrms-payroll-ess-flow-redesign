import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { recordManualPaymentApi } from '../../../api/invoices';
import useRecordManually from '../../../hooks/collectPayment/useRecordManually';

vi.mock('../../../api/invoices', () => ({
    recordManualPaymentApi: vi.fn(),
}));

const dispatchMock = vi.fn();

vi.mock('@src/hooks/hooks', () => ({
    useAppDispatch: () => dispatchMock,
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(() => ({ id: 'user123', role: 'admin' })),
}));

describe('useRecordManually', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should save payment and dispatch success toast', async () => {
        (recordManualPaymentApi as Mock).mockResolvedValue({ status: true });

        const { result } = renderHook(() => useRecordManually('inv1'));
        const onSuccess = vi.fn();

        await act(async () => {
            await result.current.savePayment(
                {
                    amountPaid: '100',
                    paymentMethod: 'cash',
                    paymentDate: '2024-01-01',
                    referenceId: 'REF1',
                    notes: 'n',
                } as any,
                onSuccess
            );
        });

        expect(recordManualPaymentApi).toHaveBeenCalledWith({
            userId: 'user123',
            userType: 'admin',
            invoiceId: 'inv1',
            amount: 100,
            paymentMethod: 'cash',
            paymentDate: '2024-01-01',
            referenceId: 'REF1',
            notes: 'n',
        });
        expect(onSuccess).toHaveBeenCalled();
        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'Payment recorded successfully.', variant: 'success' })
        );
    });

    it('should dispatch error toast when API returns failure', async () => {
        (recordManualPaymentApi as Mock).mockResolvedValue({ status: false, message: 'nope' });

        const { result } = renderHook(() => useRecordManually('inv1'));
        const onSuccess = vi.fn();

        await act(async () => {
            await result.current.savePayment(
                { amountPaid: '100', paymentMethod: 'cash', paymentDate: '2024-01-01' } as any,
                onSuccess
            );
        });

        expect(dispatchMock).toHaveBeenCalledWith(
            showToast({ description: 'nope', variant: 'error' })
        );
        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('should do nothing when invoiceId is missing', async () => {
        const { result } = renderHook(() => useRecordManually(undefined));
        await act(async () => {
            await result.current.savePayment({} as any, vi.fn());
        });
        expect(recordManualPaymentApi).not.toHaveBeenCalled();
    });
});
