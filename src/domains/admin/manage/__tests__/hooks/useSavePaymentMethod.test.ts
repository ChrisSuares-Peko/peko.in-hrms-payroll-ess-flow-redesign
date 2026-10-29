import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { showToast } from '@src/slices/apiSlice';

import {
    createPaymentMethodsByService,
    updatePaymentMethodsByService,
} from '../../api/paymentMethods';
import useSavePaymentMethod from '../../hooks/paymentMethods/useSavePaymentMethod';
import { PaymentMethodFormValues } from '../../types/paymentMethods';

const dispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => dispatch,
    useAppSelector: (selector: (state: any) => unknown) =>
        selector({ reducer: { auth: { id: 5, role: 'system_user' } } }),
}));
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'api/showToast', payload })),
}));
vi.mock('../../api/paymentMethods', () => ({
    createPaymentMethodsByService: vi.fn(),
    updatePaymentMethodsByService: vi.fn(),
}));

const gatewayValues: PaymentMethodFormValues = {
    partnerId: 1854,
    paymentMethod: 'PAYMENT_GATEWAY',
    pgProvider: 'cashfree_pg',
    services: ['11', '12'],
    limitPerTransaction: '1000',
    limitPerDay: '',
    limitPerMonth: '50000',
};

describe('useSavePaymentMethod', () => {
    const onSaved = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderSave = () => renderHook(() => useSavePaymentMethod({ onSaved }));

    it('adds a payment method with numeric services and an empty limit as no limit', async () => {
        (createPaymentMethodsByService as Mock).mockResolvedValue({ id: 31 });
        const { result } = renderSave();

        await act(async () => {
            await result.current.createPaymentMethod(gatewayValues);
        });

        expect(createPaymentMethodsByService).toHaveBeenCalledWith({
            userId: 5,
            userType: 'system_user',
            partnerId: 1854,
            paymentMethod: 'PAYMENT_GATEWAY',
            pgProvider: 'cashfree_pg',
            services: [11, 12],
            limitPerTransaction: 1000,
            limitPerDay: 0,
            limitPerMonth: 50000,
        });
        expect(onSaved).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            description: 'Payment method added',
            variant: 'success',
        });
    });

    it('saves the default partner and drops the gateway for the wallet', async () => {
        (createPaymentMethodsByService as Mock).mockResolvedValue({ id: 32 });
        const { result } = renderSave();

        await act(async () => {
            await result.current.createPaymentMethod({
                ...gatewayValues,
                partnerId: 'default',
                paymentMethod: 'WALLET',
            });
        });

        expect(createPaymentMethodsByService).toHaveBeenCalledWith(
            expect.objectContaining({ partnerId: null, paymentMethod: 'WALLET', pgProvider: null })
        );
    });

    it('updates a payment method with its limits grouped', async () => {
        (updatePaymentMethodsByService as Mock).mockResolvedValue({});
        const { result } = renderSave();

        await act(async () => {
            await result.current.updatePaymentMethod(31, gatewayValues);
        });

        expect(updatePaymentMethodsByService).toHaveBeenCalledWith({
            userId: 5,
            userType: 'system_user',
            rowIdToUpdate: 31,
            partnerId: 1854,
            paymentMethod: 'PAYMENT_GATEWAY',
            pgProvider: 'cashfree_pg',
            services: [11, 12],
            limits: { limitPerTransaction: 1000, limitPerDay: 0, limitPerMonth: 50000 },
        });
        expect(onSaved).toHaveBeenCalled();
        expect(showToast).toHaveBeenCalledWith({
            description: 'Payment method updated',
            variant: 'success',
        });
    });

    it('keeps the drawer open when saving fails', async () => {
        (updatePaymentMethodsByService as Mock).mockResolvedValue(false);
        const { result } = renderSave();

        await act(async () => {
            await result.current.updatePaymentMethod(31, gatewayValues);
        });

        expect(onSaved).not.toHaveBeenCalled();
        expect(showToast).not.toHaveBeenCalled();
        expect(result.current.isSaving).toBe(false);
    });
});
