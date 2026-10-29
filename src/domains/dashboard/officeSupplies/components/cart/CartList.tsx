import React, { useEffect, useRef } from 'react';

import { Typography, Flex, Skeleton, Image } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import CartSellerGroups from './CartSellerGroups';
import EmptyCartIMG from '../../assets/icons/emptyCart.svg';
import { useCartDetailsApi } from '../../hooks/useCartDetailsApi';
import { useSellerGroups } from '../../hooks/useSellerGroups';
import { useUnavailableItemsModal } from '../../hooks/useUnavailableItemsModal';
import { fromStockItems } from '../../utils/unavailableCartItems';
import UnavailableItemsModal from '../modals/UnavailableItemsModal';
import OrderSummary from '../OrderSummary';

/**
 * Shopping-cart page body (Figma 2304-27306): seller-grouped item cards on
 * the left, sticky Order summary on the right. The delivery-address form now
 * lives on the checkout page (Figma 2342-24561), reached via "Proceed to
 * checkout" below.
 */
const CartList: React.FC = () => {
    const { getCartDetails, isLoading } = useCartDetailsApi();
    const cartDetails = useAppSelector((state: { reducer: { cart: any } }) => state.reducer.cart);
    const { unavailable } = useSellerGroups(cartDetails.items || []);
    const {
        unavailableOpen,
        unavailableItems,
        promptUnavailable,
        dismissUnavailable,
        confirmUnavailable,
        confirmingUnavailable,
    } = useUnavailableItemsModal();
    const promptedKey = useRef('');

    useEffect(() => {
        getCartDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (isLoading) return;
        const rows = fromStockItems(unavailable);
        const key = rows.map(r => `${r.productId ?? ''}|${r.ondcProductId ?? ''}`).join(',');
        if (!rows.length) {
            promptedKey.current = '';
            return;
        }
        if (promptedKey.current === key) return;
        promptedKey.current = key;
        promptUnavailable(rows);
    }, [isLoading, unavailable, promptUnavailable]);

    if (!isLoading && cartDetails.items.length === 0) {
        return (
            <Flex gap={20} vertical className="mt-16 h-96 w-full" justify="center" align="center">
                <Image src={EmptyCartIMG} preview={false} width={150} alt="Empty cart" />
                <Typography.Text
                    data-testid="noItem"
                    className="ms-2 text-center text-base text-gray-300"
                >
                    No items found in the cart.
                </Typography.Text>
            </Flex>
        );
    }

    return (
        <div className="mt-2 flex flex-col gap-6 xl:flex-row xl:items-start">
            {/* Left: seller groups */}
            <Flex vertical gap={24} className="min-w-0 xl:flex-[2]">
                {isLoading ? (
                    <Skeleton paragraph={{ rows: 8 }} className="rounded-3xl bg-white p-6 drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)]" active />
                ) : (
                    <CartSellerGroups items={cartDetails.items} />
                )}
            </Flex>

            {/* Right: sticky order summary */}
            <div className="mb-16 md:mb-0 xl:sticky xl:top-4 xl:flex-1">
                {isLoading ? (
                    <Skeleton paragraph={{ rows: 8 }} className="rounded-3xl bg-white p-6 drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)]" active />
                ) : (
                    <OrderSummary mode="cart" />
                )}
            </div>

            <UnavailableItemsModal
                open={unavailableOpen}
                items={unavailableItems}
                confirming={confirmingUnavailable}
                onClose={dismissUnavailable}
                onConfirm={confirmUnavailable}
            />
        </div>
    );
};

export default CartList;
