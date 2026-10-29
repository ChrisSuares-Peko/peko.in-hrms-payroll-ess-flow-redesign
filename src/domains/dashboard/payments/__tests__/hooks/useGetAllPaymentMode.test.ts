import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { accessKeys } from '@utils/accessKeys';

import { fetchAvailablePgMethods } from '../../api';
import useGetAllPaymentMode from '../../hooks/useGetAllPaymentMode';
import { GatewayProvider, PgProvider } from '../../types';

const mockPayment = vi.hoisted(() => ({ accessKey: '' }));

vi.mock('../../api', () => ({
    fetchAvailablePgMethods: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppSelector: (selector: any) =>
        selector({
            reducer: {
                auth: { id: 7, role: 'corporate' },
                address: { refresh: false },
                payment: { payload: { accessKey: mockPayment.accessKey } },
            },
        }),
}));

const noLimits = { limitPerTransaction: 0, limitPerDay: 0, limitPerMonth: 0 };
const noUsage = { today: 0, month: 0 };
const cashfree = { pgProvider: 'cashfree_pg', name: 'Cashfree' };
const ccavenue = { pgProvider: 'ccavenue_pg', name: 'CC Avenue' };
const razorpay: GatewayProvider = { pgProvider: 'razorpay_pg', name: 'Razorpay', code: 'RAZORPAY' };

const checkout = async (
    accessKey: string,
    providers: GatewayProvider[],
    isWalletAvailable = false,
    provider: PgProvider | null = null
) => {
    mockPayment.accessKey = accessKey;
    (fetchAvailablePgMethods as any).mockResolvedValue({
        isCouponApplicable: true,
        gateway: { available: true, provider, limits: noLimits, usage: noUsage, providers },
        wallet: { available: isWalletAvailable, limits: noLimits, usage: noUsage },
    });
    const view = renderHook(() => useGetAllPaymentMode());
    await waitFor(() => expect(view.result.current.isPgOptionsLoading).toBe(false));
    return view.result.current;
};

describe('useGetAllPaymentMode gateway', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('offers the gateway when the gateway the service uses is enabled', async () => {
        const result = await checkout(accessKeys.electricity, [cashfree, ccavenue]);

        expect(result.availablePgOptions.gateway.available).toBe(true);
        expect(result.isPgDown).toBe(false);
    });

    it('hides the gateway when the gateway the service uses is not enabled', async () => {
        const result = await checkout(accessKeys.hotels, [ccavenue], true);

        expect(result.availablePgOptions.gateway.available).toBe(false);
        expect(result.isPgDown).toBe(false);
    });

    it('reports no payment methods when the hidden gateway was the only option', async () => {
        const result = await checkout(accessKeys.electricity, [cashfree]);

        expect(result.availablePgOptions.gateway.available).toBe(false);
        expect(result.isPgDown).toBe(true);
    });

    it('keeps the gateway as today when no gateway is configured', async () => {
        const result = await checkout(accessKeys.hotels, []);

        expect(result.availablePgOptions.gateway.available).toBe(true);
    });

    it('offers a partner configured only for Razorpay when the API picks Razorpay', async () => {
        const result = await checkout(accessKeys.hotels, [razorpay], false, 'RAZORPAY');

        expect(result.availablePgOptions.gateway.available).toBe(true);
        expect(result.availablePgOptions.gateway.provider).toBe('RAZORPAY');
        expect(result.isPgDown).toBe(false);
    });
});
