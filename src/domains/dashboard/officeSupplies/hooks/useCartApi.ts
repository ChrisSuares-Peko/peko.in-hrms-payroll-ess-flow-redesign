import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useCartDetailsApi } from './useCartDetailsApi';
import { fetchDeliveryEstimate } from './useDeliveryEstimate';
import {
    addToCartApi,
    clearUnavailableFromCartApi,
    deleteFromCartApi,
    updateCartApi,
} from '../api/cart';
import {
    AddToCartRequestResponse,
    ClearUnavailableResponse,
    DeleteFromCartResponse,
    updateFromCartResponse,
} from '../types/cartTypes';
import { UnavailableCartItem } from '../utils/unavailableCartItems';

/**
 * How the delivery estimate reaches an add-to-cart call:
 * - `estimate`: already fetched (the PDP fetches it on entry) — pass it straight through.
 * - `ondcProductId`: not fetched yet (a product card) — best-effort fetch it here first,
 *   then add. Either is optional; the add always proceeds even if no estimate results.
 */
type AddOptions = {
    ondcProductId?: string;
    estimate?: { expectedDeliveryDate?: string | null; deliveryTat?: string | null };
};

export function useCartApi() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<number>();
    const [actionType, setActionType] = useState<'buy' | 'add' | 'delete' | 'update' | null>(null);

    const { getCartDetails } = useCartDetailsApi();

    // Resolve the estimate to persist: use a pre-fetched one, else best-effort
    // fetch by ondcProductId (product-card flow). Never blocks the add on failure.
    const resolveEstimate = async (productQuantity: number, opts?: AddOptions) => {
        if (opts?.estimate) return opts.estimate;
        if (opts?.ondcProductId) {
            const snapshot = await fetchDeliveryEstimate({
                userId: id,
                userType: role,
                ondcProductId: opts.ondcProductId,
                quantity: productQuantity,
            });
            if (snapshot) {
                return {
                    expectedDeliveryDate: snapshot.expectedDeliveryDate,
                    deliveryTat: snapshot.deliveryTat,
                };
            }
        }
        return undefined;
    };

    const buyNow = async (productId: number, productQuantity: number, opts?: AddOptions) => {
        setSelectedProductId(productId);
        setActionType('buy');
        setIsLoading(true);
        const estimate = await resolveEstimate(productQuantity, opts);
        const data: AddToCartRequestResponse | false = await addToCartApi({
            userId: id,
            userType: role,
            productId,
            productQuantity,
            expectedDeliveryDate: estimate?.expectedDeliveryDate ?? null,
            deliveryTat: estimate?.deliveryTat ?? null,
        });
        if (data) {
            getCartDetails();
            const cartStatus = data as AddToCartRequestResponse;
            if (cartStatus.status === 'added') {
                setIsLoading(false);
                setActionType(null);
                return true;
            }
            if (cartStatus.status === 'updated') {
                setIsLoading(false);
                setActionType(null);
                return true;
            }
            setIsLoading(false);
            setActionType(null);
            return false;
        }
        setIsLoading(false);
        setActionType(null);
        return false;
    };

    const addToCart = async (productId: number, productQuantity: number, opts?: AddOptions) => {
        setSelectedProductId(productId);
        setActionType('add');
        setIsLoading(true);
        const estimate = await resolveEstimate(productQuantity, opts);
        const data: AddToCartRequestResponse | false = await addToCartApi({
            userId: id,
            userType: role,
            productId,
            productQuantity,
            expectedDeliveryDate: estimate?.expectedDeliveryDate ?? null,
            deliveryTat: estimate?.deliveryTat ?? null,
        });
        if (data) {
            getCartDetails();
            const cartStatus = data as AddToCartRequestResponse;
            if (cartStatus.status === 'added') {
                dispatch(
                    showToast({
                        description: 'Product successfully added to cart',
                        variant: 'success',
                    })
                );
            } else if (cartStatus.status === 'updated') {
                dispatch(
                    showToast({
                        description: 'Product successfully updated in cart',
                        variant: 'success',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description: 'Failed to add product to cart. Please try again later.',
                        variant: 'error',
                    })
                );
            }
            setIsLoading(false);
            setActionType(null);
        } else {
            setIsLoading(false);
            setActionType(null);
        }
    };

    const deleteItemFromCart = async (productId: number) => {
        setSelectedProductId(productId);
        setActionType('delete');
        setIsLoading(true);
        const data: DeleteFromCartResponse | false = await deleteFromCartApi({
            userId: id,
            userType: role,
            productId,
        });
        if (data) {
            dispatch(
                showToast({ description: 'Product removed successfully', variant: 'success' })
            );
            getCartDetails();
            setIsLoading(false);
            setActionType(null);
        } else {
            setIsLoading(false);
            setActionType(null);
        }
    };

    /** Remove all "No longer available" items in a single backend call. */
    const clearUnavailableItems = async () => {
        setIsLoading(true);
        const data: ClearUnavailableResponse | false = await clearUnavailableFromCartApi({
            userId: id,
            userType: role,
        });
        if (data) {
            dispatch(
                showToast({
                    description: 'Unavailable products removed from cart',
                    variant: 'success',
                })
            );
            await getCartDetails();
        } else {
            dispatch(
                showToast({
                    description: 'Failed to remove unavailable products. Please try again later.',
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);
    };

    /**
     * Confirm-to-remove for the unavailable-items modal: one clearUnavailable
     * for stock/listing-gone rows, then per-id deletes for seller-validation
     * failures. One cart refresh and one toast at the end.
     */
    const removeCartItems = async (items: UnavailableCartItem[]): Promise<boolean> => {
        if (!items.length) return true;
        setActionType('delete');
        setIsLoading(true);
        let ok = true;
        const needsClear = items.some(item => item.stockUnavailable || item.productId == null);
        if (needsClear) {
            const cleared = await clearUnavailableFromCartApi({
                userId: id,
                userType: role,
            });
            if (!cleared) ok = false;
        }
        const deleteIds = [
            ...new Set(
                items
                    .filter(item => item.productId != null && !item.stockUnavailable)
                    .map(item => item.productId as number)
            ),
        ];
        const deleteResults = await Promise.all(
            deleteIds.map(productId =>
                deleteFromCartApi({
                    userId: id,
                    userType: role,
                    productId,
                })
            )
        );
        if (deleteResults.some(deleted => !deleted)) ok = false;
        if (ok) {
            dispatch(
                showToast({
                    description: 'Unavailable products removed from cart',
                    variant: 'success',
                })
            );
            await getCartDetails();
        } else {
            dispatch(
                showToast({
                    description: 'Failed to remove unavailable products. Please try again later.',
                    variant: 'error',
                })
            );
        }
        setIsLoading(false);
        setActionType(null);
        return ok;
    };

    const updateCart = async (productId: number, operation: string) => {
        setSelectedProductId(productId);
        setActionType('update');
        setIsLoading(true);
        const data: updateFromCartResponse | false = await updateCartApi({
            userId: id,
            userType: role,
            productId,
            operation,
            productQuantity: 1,
        });
        if (data) {
            getCartDetails();
            setIsLoading(false);
            setActionType(null);
        } else {
            setIsLoading(false);
            setActionType(null);
        }
    };

    return {
        isLoading,
        selectedProductId,
        actionType,
        addToCart,
        deleteItemFromCart,
        clearUnavailableItems,
        removeCartItems,
        updateCart,
        buyNow,
    };
}
