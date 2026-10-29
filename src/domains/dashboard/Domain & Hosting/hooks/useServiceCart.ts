import { useCallback, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getCart, addToCart, updateCart, updateCartItemDetails, removeFromCart, clearCart } from '../api/index';
import { setCartData, setCustomerData, setCustomerId } from '../slices/domainHostingSlice';
import { AddToCartPayload, CartItem } from '../types/index';

// backup is always paired with vps_server — treat them as the same service group
const getServiceGroup = (type: string) => (type === 'backup' ? 'vps_server' : type);

const isSameCartItem = (
    existing: CartItem,
    incoming: Omit<AddToCartPayload, 'userId' | 'userType'>
) => {
    if (existing.productId !== incoming.productId) return false;
    if ((existing.planId ?? null) !== (incoming.planId ?? null)) return false;

    const existingCycle = existing.billingCycle ?? null;
    const incomingCycle = incoming.billingCycle ?? null;

    if (existingCycle !== incomingCycle) return false;

    return true;
};

const isSamePlanIgnoringBilling = (
    existing: CartItem,
    incoming: Omit<AddToCartPayload, 'userId' | 'userType'>
) => existing.productId === incoming.productId && (existing.planId ?? null) === (incoming.planId ?? null);

const getWorkspaceSeatCount = (item: CartItem) => item.seats ?? item.productQuantity ?? 1;
const getEmailAccountCount = (item: CartItem) => item.accounts ?? item.productQuantity ?? 1;

export default function useServiceCart() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const cartData = useAppSelector(state => state.reducer.domainHosting.cartData);
    const [isLoading, setIsLoading] = useState(false);
    const [conflictItem, setConflictItem] = useState<Omit<AddToCartPayload, 'userId' | 'userType'> | null>(null);
    const conflictResolverRef = useRef<((confirmed: boolean) => void) | null>(null);
    const dispatch = useAppDispatch();

    const fetchCart = useCallback(async (isCustomerFetch = false) => {
        setIsLoading(true);
        const data = await getCart({ userId: id, userType: role, isCustomerFetch });
        if (data) {
            dispatch(setCartData(data));
            if (data.customerDetails?.customerid) {
                dispatch(setCustomerId(String(data.customerDetails.customerid)));
                dispatch(setCustomerData(data.customerDetails));
            }
        }
        setIsLoading(false);
        return data;
    }, [dispatch, id, role]);

    const handleConflictConfirm = useCallback(async () => {
        if (!conflictItem || !conflictResolverRef.current) return;
        setIsLoading(true);
        await clearCart({ userId: id, userType: role });
        dispatch(setCartData(null));
        const data = await addToCart({ ...conflictItem, userId: id, userType: role } as AddToCartPayload);
        if (data && data.status !== false) {
            await fetchCart();
        } else {
            dispatch(showToast({ variant: 'error', description: data?.message || 'Failed to add item. Please try again.' }));
        }
        setIsLoading(false);
        const resolve = conflictResolverRef.current;
        conflictResolverRef.current = null;
        setConflictItem(null);
        resolve(true);
    }, [conflictItem, dispatch, fetchCart, id, role]);

    const handleConflictCancel = useCallback(() => {
        const resolve = conflictResolverRef.current;
        conflictResolverRef.current = null;
        setConflictItem(null);
        resolve?.(false);
    }, []);

    const handleAddToCart = useCallback(
        async (item: Omit<AddToCartPayload, 'userId' | 'userType'>): Promise<unknown> => {
            setIsLoading(true);

            // If the cart already has a different service group, ask before replacing
            const newGroup = getServiceGroup(item.itemType ?? '');
            const hasConflict = cartData?.items
                ?.filter(ci => ci.itemType !== 'backup')
                .some(ci => getServiceGroup(ci.itemType) !== newGroup);

            if (hasConflict) {
                setIsLoading(false);
                return new Promise(resolve => {
                    conflictResolverRef.current = resolve;
                    setConflictItem(item);
                });
            }

            const existing = cartData?.items?.find(ci => isSameCartItem(ci, item));
            const existingWithDifferentBilling = cartData?.items?.find(ci => {
                if (!isSamePlanIgnoringBilling(ci, item)) return false;
                return (ci.billingCycle ?? null) !== (item.billingCycle ?? null);
            });
            let data;
            if (existing) {
                if (existing.itemType === 'titan_email') {
                    data = await updateCartItemDetails({
                        userId: id,
                        userType: role,
                        productId: existing.productId,
                        planId: existing.planId ?? null,
                        billingCycle: existing.billingCycle,
                        accounts: getEmailAccountCount(existing) + 1,
                    });
                } else if (existing.itemType === 'google_workspace') {
                    data = await updateCartItemDetails({
                        userId: id,
                        userType: role,
                        productId: existing.productId,
                        planId: existing.planId ?? null,
                        billingCycle: existing.billingCycle,
                        seats: getWorkspaceSeatCount(existing) + 1,
                    });
                } else {
                    data = await updateCart({
                        productId: existing.productId,
                        planId: existing.planId ?? undefined,
                        billingCycle: existing.billingCycle,
                        operation: 'increase',
                        userId: id,
                        userType: role,
                    });
                }
            } else if (
                existingWithDifferentBilling &&
                (item.itemType === 'google_workspace' || item.itemType === 'titan_email')
            ) {
                data = await updateCartItemDetails({
                    userId: id,
                    userType: role,
                    productId: existingWithDifferentBilling.productId,
                    planId: existingWithDifferentBilling.planId ?? null,
                    billingCycle: item.billingCycle ?? existingWithDifferentBilling.billingCycle,
                    ...(item.itemType === 'google_workspace'
                        ? { seats: getWorkspaceSeatCount(existingWithDifferentBilling) }
                        : { accounts: getEmailAccountCount(existingWithDifferentBilling) }),
                });
                dispatch(
                    showToast({
                        variant: 'info',
                        description:
                            'This plan was already in your cart. Billing period has been updated on the existing cart item.',
                    })
                );
            } else {
                data = await addToCart({
                    ...item,
                    userId: id,
                    userType: role,
                } as AddToCartPayload);
            }
            if (data && data.status !== false) {
                await fetchCart();
            } else {
                if (data && data.status === false) {
                    dispatch(showToast({ variant: 'error', description: data.message || 'Failed to update cart. Please try again.' }));
                }
                data = false;
            }
            setIsLoading(false);
            return data;
        },
        [cartData, dispatch, fetchCart, id, role]
    );

    const handleUpdateCart = useCallback(
        async (
            productId: string,
            operation: 'increase' | 'decrease',
            planId?: string | null,
            billingCycle?: number
        ) => {
            setIsLoading(true);
            const data = await updateCart({
                productId,
                planId,
                billingCycle,
                operation,
                userId: id,
                userType: role,
            });
            if (data) await fetchCart();
            setIsLoading(false);
            return data;
        },
        [fetchCart, id, role]
    );

    const handleRemoveFromCart = useCallback(
        async (productId: string, planId?: string | null, billingCycle?: number, productName?: string | null, itemType?: string | null) => {
            setIsLoading(true);
            const data = await removeFromCart({
                productId,
                planId,
                billingCycle,
                productName,
                itemType,
                userId: id,
                userType: role,
            });
            if (data) await fetchCart();
            setIsLoading(false);
            return data;
        },
        [fetchCart, id, role]
    );

    const handleClearCart = useCallback(async () => {
        setIsLoading(true);
        const data = await clearCart({ userId: id, userType: role });
        if (data) dispatch(setCartData(null));
        setIsLoading(false);
        return data;
    }, [dispatch, id, role]);

    const cartConflictModalProps = {
        isOpen: !!conflictItem,
        title: 'Replace Cart?',
        description: 'Your cart already contains a different service. Continuing will clear your current cart. Do you want to proceed?',
        handleSubmit: handleConflictConfirm,
        handleCancel: handleConflictCancel,
        isLoading,
    };

    return {
        fetchCart,
        handleAddToCart,
        handleUpdateCart,
        handleRemoveFromCart,
        handleClearCart,
        isLoading,
        cartConflictModalProps,
    };
}
