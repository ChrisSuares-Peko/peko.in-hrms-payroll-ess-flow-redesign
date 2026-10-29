import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { clearUnavailableFromCartApi, deleteFromCartApi } from '../../api/cart';
import { useCartApi } from '../../hooks/useCartApi';
import { useCartDetailsApi } from '../../hooks/useCartDetailsApi';
import { UnavailableCartItem } from '../../utils/unavailableCartItems';

const mockGetCartDetails = vi.fn();
const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: (selectorFn: any) =>
        selectorFn({ reducer: { auth: { id: 7, role: 'corporate' } } }),
}));

vi.mock('@src/slices/apiSlice', () => ({
    default: (state = {}) => state,
    showToast: vi.fn(payload => ({ type: 'api/showToast', payload })),
}));

vi.mock('../../hooks/useCartDetailsApi', () => ({
    useCartDetailsApi: vi.fn(),
}));

vi.mock('../../hooks/useDeliveryEstimate', () => ({
    fetchDeliveryEstimate: vi.fn(),
}));

vi.mock('../../api/cart', () => ({
    addToCartApi: vi.fn(),
    clearUnavailableFromCartApi: vi.fn(),
    deleteFromCartApi: vi.fn(),
    updateCartApi: vi.fn(),
}));

const stockRow: UnavailableCartItem = {
    productId: 1,
    ondcProductId: 'SKU-GONE',
    productName: 'Old listing',
    image: '',
    vendorName: 'Office Mart',
    reason: 'This item is out of stock or no longer listed by the seller, so it cannot be ordered.',
    stockUnavailable: true,
};

const failedRow: UnavailableCartItem = {
    productId: 9,
    ondcProductId: 'SKU-9',
    productName: 'Stapler',
    image: '',
    vendorName: 'Other Seller',
    reason: 'The seller cannot deliver this to your pincode.',
    stockUnavailable: false,
};

describe('useCartApi.removeCartItems', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetCartDetails.mockResolvedValue(undefined);
        (useCartDetailsApi as unknown as Mock).mockReturnValue({
            getCartDetails: mockGetCartDetails,
            isLoading: false,
        });
        (clearUnavailableFromCartApi as Mock).mockResolvedValue({ removed: 1 });
        (deleteFromCartApi as Mock).mockResolvedValue({});
    });

    it('clears stock-unavailable rows once, then refreshes the cart', async () => {
        const { result } = renderHook(() => useCartApi());

        let ok = false;
        await act(async () => {
            ok = await result.current.removeCartItems([stockRow]);
        });

        expect(ok).toBe(true);
        expect(clearUnavailableFromCartApi).toHaveBeenCalledTimes(1);
        expect(clearUnavailableFromCartApi).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
        });
        expect(deleteFromCartApi).not.toHaveBeenCalled();
        expect(mockGetCartDetails).toHaveBeenCalledTimes(1);
    });

    it('deletes failed-but-listed rows by productId without a per-item toast', async () => {
        const { result } = renderHook(() => useCartApi());

        await act(async () => {
            await result.current.removeCartItems([failedRow, { ...failedRow, productName: 'dup' }]);
        });

        expect(clearUnavailableFromCartApi).not.toHaveBeenCalled();
        expect(deleteFromCartApi).toHaveBeenCalledTimes(1);
        expect(deleteFromCartApi).toHaveBeenCalledWith({
            userId: 7,
            userType: 'corporate',
            productId: 9,
        });
        expect(mockGetCartDetails).toHaveBeenCalledTimes(1);
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({
                    description: 'Unavailable products removed from cart',
                }),
            })
        );
    });

    it('runs clearUnavailable and per-id deletes together, then one refresh', async () => {
        const { result } = renderHook(() => useCartApi());

        await act(async () => {
            await result.current.removeCartItems([stockRow, failedRow]);
        });

        expect(clearUnavailableFromCartApi).toHaveBeenCalledTimes(1);
        expect(deleteFromCartApi).toHaveBeenCalledTimes(1);
        expect(mockGetCartDetails).toHaveBeenCalledTimes(1);
    });
});
