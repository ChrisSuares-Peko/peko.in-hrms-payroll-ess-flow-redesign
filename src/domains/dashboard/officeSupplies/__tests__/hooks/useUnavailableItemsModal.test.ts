import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useCartApi } from '../../hooks/useCartApi';
import { useUnavailableItemsModal } from '../../hooks/useUnavailableItemsModal';
import { UnavailableCartItem } from '../../utils/unavailableCartItems';

const mockRemoveCartItems = vi.fn();

vi.mock('../../hooks/useCartApi', () => ({
    useCartApi: vi.fn(),
}));

const item: UnavailableCartItem = {
    productId: 9,
    ondcProductId: 'SKU-9',
    productName: 'Stapler',
    image: '',
    vendorName: 'Other Seller',
    reason: 'The seller cannot deliver this to your pincode.',
    stockUnavailable: false,
};

describe('useUnavailableItemsModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockRemoveCartItems.mockResolvedValue(true);
        (useCartApi as unknown as Mock).mockReturnValue({
            removeCartItems: mockRemoveCartItems,
            isLoading: false,
        });
    });

    it('opens with the listed items and does not delete on dismiss', async () => {
        const { result } = renderHook(() => useUnavailableItemsModal());

        act(() => {
            result.current.promptUnavailable([item]);
        });

        expect(result.current.unavailableOpen).toBe(true);
        expect(result.current.unavailableItems).toEqual([item]);

        act(() => {
            result.current.dismissUnavailable();
        });

        expect(result.current.unavailableOpen).toBe(false);
        expect(mockRemoveCartItems).not.toHaveBeenCalled();
    });

    it('deletes through removeCartItems on confirm and then runs the after-remove callback', async () => {
        const onRemoved = vi.fn();
        const { result } = renderHook(() => useUnavailableItemsModal());

        act(() => {
            result.current.promptUnavailable([item], onRemoved);
        });

        await act(async () => {
            await result.current.confirmUnavailable();
        });

        expect(mockRemoveCartItems).toHaveBeenCalledWith([item]);
        expect(onRemoved).toHaveBeenCalledTimes(1);
        expect(result.current.unavailableOpen).toBe(false);
    });

    it('leaves the modal open and skips the callback when delete fails', async () => {
        mockRemoveCartItems.mockResolvedValue(false);
        const onRemoved = vi.fn();
        const { result } = renderHook(() => useUnavailableItemsModal());

        act(() => {
            result.current.promptUnavailable([item], onRemoved);
        });

        await act(async () => {
            await result.current.confirmUnavailable();
        });

        expect(onRemoved).not.toHaveBeenCalled();
        expect(result.current.unavailableOpen).toBe(true);
    });
});
