import { useMemo } from 'react';

import { CartItem } from '../types/cartTypes';

/**
 * Groups cart items by seller (`vendorName?.trim() || 'Seller'`), splitting
 * out `!item.available` items into their own bucket — the single source of
 * truth for both CartSellerGroups (cart page's editable tables) and
 * OrderReview (checkout page's read-only summary).
 */
export function useSellerGroups(items: CartItem[]) {
    return useMemo(() => {
        const byVendor = new Map<string, CartItem[]>();
        const gone: CartItem[] = [];
        items.forEach(item => {
            if (!item.available) {
                gone.push(item);
                return;
            }
            const key = item.vendorName?.trim() || 'Seller';
            byVendor.set(key, [...(byVendor.get(key) || []), item]);
        });
        return { groups: Array.from(byVendor.entries()), unavailable: gone };
    }, [items]);
}
