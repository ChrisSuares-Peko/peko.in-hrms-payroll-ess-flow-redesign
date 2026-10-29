import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

/** Query param Buy Now sets on the checkout URL. */
export const BUY_NOW_PARAM = 'buyNow';

/**
 * "Buy Now" checks out a single product without disturbing the rest of the cart.
 * The scope rides in the URL (`/office-supplies/cart/checkout?buyNow=<ondcProductId>`)
 * rather than redux, so it survives a refresh — the established cross-route
 * pattern in this domain.
 *
 * Keyed on ondcProductId: productId is a listing row id that changes on every
 * catalog refresh.
 *
 * `ondcProductIds` is undefined when there is no scope, which is exactly what
 * validateCart/initOrder treat as "the whole cart" — so the normal cart →
 * checkout path passes through unchanged.
 */
export const useBuyNowScope = () => {
    const [searchParams] = useSearchParams();
    const buyNowId = searchParams.get(BUY_NOW_PARAM)?.trim() || null;

    // Memoised so the array identity is stable across renders — callers list it
    // in useCallback/useEffect dependencies.
    const ondcProductIds = useMemo(
        () => (buyNowId ? [buyNowId] : undefined),
        [buyNowId]
    );

    return { buyNowId, ondcProductIds, isBuyNow: Boolean(buyNowId) };
};

export default useBuyNowScope;
