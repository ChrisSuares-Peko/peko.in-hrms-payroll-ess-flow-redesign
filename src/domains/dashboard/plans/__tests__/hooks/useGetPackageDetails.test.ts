import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getPackageDetails, getSubscriptionPricing } from '../../api';
import useGetPackageDetails from '../../hooks/useGetPackageDetails';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('../../api', () => ({
    getPackageDetails: vi.fn(),
    getSubscriptionPricing: vi.fn(),
}));

const packageConfig = {
    packageDetails: {
        id: 11,
        packageName: 'Payroll',
        packagePrices: { monthly: '999', annually: '9990' },
        discount: { monthly: 0, annually: 0 },
        description: '',
        serviceList: '',
    },
};

const basePricing = {
    packagePrice: 999,
    packageDiscount: 0,
    additionalDiscount: 0,
    couponDiscount: 0,
    totalDiscount: 0,
    annualAddonPrice: 0,
    monthlyAddonPrice: 0,
    breakdown: { price: 0, breakdown: [] },
};

describe('useGetPackageDetails — GST add-on', () => {
    const dispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as Mock).mockReturnValue(dispatch);
        (useAppSelector as Mock).mockImplementation(selector =>
            selector({ reducer: { auth: { role: 'corporate', id: 1 } } })
        );
        (getPackageDetails as Mock).mockResolvedValue(packageConfig);
    });

    it('GST mode: copies the tax fields and uses the gross expectedPaymentAmount as the total', async () => {
        (getSubscriptionPricing as Mock).mockResolvedValue({
            ...basePricing,
            taxableAmount: 999,
            taxAmount: 179.82,
            taxRate: 18,
            expectedPaymentAmount: 1178.82,
        });
        const setTotalPackagePrice = vi.fn();
        const { result } = renderHook(() =>
            useGetPackageDetails({
                packageId: 11,
                selectedType: 'monthly',
                setTotalPackagePrice,
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(setTotalPackagePrice).toHaveBeenCalledWith(1178.82);
        expect(result.current.data?.taxableAmount).toBe(999);
        expect(result.current.data?.taxAmount).toBe(179.82);
        expect(result.current.data?.taxRate).toBe(18);
    });

    it('legacy mode: tax fields stay undefined and the net total is used unchanged', async () => {
        (getSubscriptionPricing as Mock).mockResolvedValue({
            ...basePricing,
            expectedPaymentAmount: 999,
        });
        const setTotalPackagePrice = vi.fn();
        const { result } = renderHook(() =>
            useGetPackageDetails({
                packageId: 11,
                selectedType: 'monthly',
                setTotalPackagePrice,
            })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(setTotalPackagePrice).toHaveBeenCalledWith(999);
        expect(result.current.data?.taxAmount).toBeUndefined();
    });

    it('passes the coupon code to the pricing endpoint and re-fetches when it changes', async () => {
        (getSubscriptionPricing as Mock).mockResolvedValue({
            ...basePricing,
            taxableAmount: 999,
            taxAmount: 179.82,
            taxRate: 18,
            expectedPaymentAmount: 1178.82,
        });
        const setTotalPackagePrice = vi.fn();
        const { result, rerender } = renderHook(
            ({ couponCode }: { couponCode?: string }) =>
                useGetPackageDetails({
                    packageId: 11,
                    selectedType: 'monthly',
                    setTotalPackagePrice,
                    couponCode,
                }),
            { initialProps: { couponCode: undefined as string | undefined } }
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(getSubscriptionPricing).toHaveBeenCalledWith(
            expect.objectContaining({ couponCode: undefined })
        );

        rerender({ couponCode: 'SAVE99' });
        await waitFor(() =>
            expect(getSubscriptionPricing).toHaveBeenCalledWith(
                expect.objectContaining({ couponCode: 'SAVE99' })
            )
        );
    });

    it('errors out (no client-side total fallback) when the pricing call fails', async () => {
        (getSubscriptionPricing as Mock).mockResolvedValue(false);
        const setTotalPackagePrice = vi.fn();
        const { result } = renderHook(() =>
            useGetPackageDetails({
                packageId: 11,
                selectedType: 'monthly',
                setTotalPackagePrice,
            })
        );

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(setTotalPackagePrice).not.toHaveBeenCalled();
    });
});
