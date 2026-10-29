import { useCallback, useState } from 'react';

import { useCartApi } from './useCartApi';
import { CartItem } from '../types/cartTypes';

/**
 * Confirm-to-remove prompt for a single cart row.
 *
 * Both removal paths (the − stepper at the minimum order quantity, and the row's
 * trash button) used to call deleteItemFromCart straight away, so an item could
 * vanish on one mis-tap. Dismiss does not delete.
 *
 * Shaped like useUnavailableItemsModal, the domain's existing confirm-to-remove hook.
 */
export function useRemoveCartItemModal() {
    const [item, setItem] = useState<CartItem | null>(null);
    const { deleteItemFromCart, isLoading } = useCartApi();

    const promptRemove = useCallback((next: CartItem) => {
        if (!next?.productId) return;
        setItem(next);
    }, []);

    const dismissRemove = useCallback(() => {
        if (isLoading) return;
        setItem(null);
    }, [isLoading]);

    const confirmRemove = useCallback(async () => {
        if (!item?.productId) return false;
        await deleteItemFromCart(item.productId);
        setItem(null);
        return true;
    }, [item, deleteItemFromCart]);

    return {
        removeOpen: Boolean(item),
        removeItem: item,
        promptRemove,
        dismissRemove,
        confirmRemove,
        removing: isLoading,
    };
}
