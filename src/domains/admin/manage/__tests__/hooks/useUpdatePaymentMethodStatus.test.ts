import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import { updatePaymentMethodStatusApi } from '../../api/paymentMethods';
import useUpdatePaymentMethodStatus from '../../hooks/paymentMethods/useUpdatePaymentMethodStatus';

const dispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({ reducer: { auth: { id: 5, role: 'system_user' } } }),
}));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'api/showToast', payload })),
}));
vi.mock('../../api/paymentMethods', () => ({ updatePaymentMethodStatusApi: vi.fn() }));

describe('useUpdatePaymentMethodStatus', () => {
    const onUpdated = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('saves the status, refreshes the rows and confirms it', async () => {
        (updatePaymentMethodStatusApi as Mock).mockResolvedValue({ id: 9, isActive: false });
        const { result } = renderHook(() => useUpdatePaymentMethodStatus({ onUpdated }));

        let saved: boolean | undefined;
        await act(async () => {
            saved = await result.current.updateStatus(9, false);
        });

        expect(updatePaymentMethodStatusApi).toHaveBeenCalledWith({
            userId: 5,
            userType: 'system_user',
            paymentMethodId: 9,
            isActive: false,
        });
        expect(saved).toBe(true);
        expect(onUpdated).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            description: 'Payment method disabled successfully',
            variant: 'success',
        });
        expect(result.current.updatingId).toBeNull();
    });

    it('leaves the rows alone when saving fails', async () => {
        (updatePaymentMethodStatusApi as Mock).mockResolvedValue(false);
        const { result } = renderHook(() => useUpdatePaymentMethodStatus({ onUpdated }));

        let saved: boolean | undefined;
        await act(async () => {
            saved = await result.current.updateStatus(9, true);
        });

        expect(saved).toBe(false);
        expect(onUpdated).not.toHaveBeenCalled();
        expect(showToast).not.toHaveBeenCalled();
        expect(result.current.updatingId).toBeNull();
    });

    it('marks the row being saved', async () => {
        let resolveSave: (value: unknown) => void = () => {};
        (updatePaymentMethodStatusApi as Mock).mockReturnValue(
            new Promise(resolve => {
                resolveSave = resolve;
            })
        );
        const { result } = renderHook(() => useUpdatePaymentMethodStatus({ onUpdated }));

        let pending: Promise<boolean> = Promise.resolve(false);
        act(() => {
            pending = result.current.updateStatus(9, true);
        });

        expect(result.current.updatingId).toBe(9);

        await act(async () => {
            resolveSave({ id: 9, isActive: true });
            await pending;
        });

        expect(result.current.updatingId).toBeNull();
    });
});
