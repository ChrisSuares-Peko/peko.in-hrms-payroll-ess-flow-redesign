import { useCallback, useRef, useState } from 'react';

import { useCartApi } from './useCartApi';
import { UnavailableCartItem } from '../utils/unavailableCartItems';

/**
 * Shared confirm-to-remove prompt for stock-unavailable cart rows and failed
 * seller groups. Dismiss does not delete.
 */
export function useUnavailableItemsModal() {
    const [items, setItems] = useState<UnavailableCartItem[]>([]);
    const [open, setOpen] = useState(false);
    const afterRemoveRef = useRef<(() => void) | undefined>();
    const { removeCartItems, isLoading } = useCartApi();

    const promptUnavailable = useCallback(
        (next: UnavailableCartItem[], onRemoved?: () => void) => {
            if (!next.length) return;
            afterRemoveRef.current = onRemoved;
            setItems(next);
            setOpen(true);
        },
        []
    );

    const dismissUnavailable = useCallback(() => {
        if (isLoading) return;
        setOpen(false);
        afterRemoveRef.current = undefined;
    }, [isLoading]);

    const confirmUnavailable = useCallback(async () => {
        const ok = await removeCartItems(items);
        if (!ok) return false;
        setOpen(false);
        const cb = afterRemoveRef.current;
        afterRemoveRef.current = undefined;
        cb?.();
        return true;
    }, [items, removeCartItems]);

    return {
        unavailableOpen: open,
        unavailableItems: items,
        promptUnavailable,
        dismissUnavailable,
        confirmUnavailable,
        confirmingUnavailable: isLoading,
    };
}
