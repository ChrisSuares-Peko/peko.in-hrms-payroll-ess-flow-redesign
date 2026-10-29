import React, { useEffect, useRef, useState } from 'react';

import { Flex, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import DeliveryDetails from './DeliveryDetails';
import OrderReview from './OrderReview';
import { useBuyNowScope } from '../../hooks/useBuyNowScope';
import { useCartDetailsApi } from '../../hooks/useCartDetailsApi';
import { useUnavailableItemsModal } from '../../hooks/useUnavailableItemsModal';
import { AddressField } from '../../types/address';
import { CartItem } from '../../types/cartTypes';
import { fromStockItems } from '../../utils/unavailableCartItems';
import UnavailableItemsModal from '../modals/UnavailableItemsModal';
import OrderSummary from '../OrderSummary';

/**
 * Checkout page body (Figma 2342-24561): delivery-address form + read-only
 * order review on the left, sticky Order summary on the right. Redirects
 * back to the cart if it's reached directly with an empty cart.
 */
const CheckoutList: React.FC = () => {
    const navigate = useNavigate();
    const { getCartDetails, isLoading } = useCartDetailsApi();
    const [address, setAddress] = useState<AddressField>();
    const cartDetails = useAppSelector((state: { reducer: { cart: any } }) => state.reducer.cart);
    const {
        unavailableOpen,
        unavailableItems,
        promptUnavailable,
        dismissUnavailable,
        confirmUnavailable,
        confirmingUnavailable,
    } = useUnavailableItemsModal();
    const promptedKey = useRef('');

    // Wired from Order summary's "Proceed to checkout" into DeliveryDetails' Formik.
    const formRef = useRef<any>(null);

    useEffect(() => {
        getCartDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Buy Now checks out ONE product; everything else in the cart stays behind
    // and is not part of this order.
    const { buyNowId } = useBuyNowScope();
    const checkoutItems: CartItem[] = buyNowId
        ? (cartDetails.items || []).filter(
              (item: CartItem) => String(item.ondcProductId ?? '') === buyNowId
          )
        : cartDetails.items;

    useEffect(() => {
        // Also bounces a stale Buy Now link whose product is no longer in the cart
        // (already ordered, or removed in another tab) — otherwise checkout would
        // render empty rather than sending the user somewhere useful.
        if (!isLoading && checkoutItems.length === 0) {
            navigate(`${paths.dashboard.officeSupplies}/${paths.officeSupplies.cartPage}`, {
                replace: true,
            });
        }
    }, [isLoading, checkoutItems.length, navigate]);

    useEffect(() => {
        if (isLoading) return;
        const rows = fromStockItems(checkoutItems || []);
        const key = rows.map(r => `${r.productId ?? ''}|${r.ondcProductId ?? ''}`).join(',');
        if (!rows.length) {
            promptedKey.current = '';
            return;
        }
        if (promptedKey.current === key) return;
        promptedKey.current = key;
        promptUnavailable(rows);
    }, [isLoading, checkoutItems, promptUnavailable]);

    if (isLoading) {
        return (
            <div className="mt-2 flex flex-col gap-6 xl:flex-row xl:items-start">
                <Skeleton
                    paragraph={{ rows: 10 }}
                    className="min-w-0 rounded-3xl bg-white p-6 drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)] xl:flex-[2]"
                    active
                />
                <Skeleton paragraph={{ rows: 8 }} className="rounded-3xl bg-white p-6 drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)] xl:flex-1" active />
            </div>
        );
    }

    // Redirect effect above is firing — render nothing while it navigates away.
    if (checkoutItems.length === 0) return null;

    return (
        <div className="mt-2 flex flex-col gap-6 xl:flex-row xl:items-start">
            {/* Left: delivery details + order review */}
            <Flex vertical gap={24} className="min-w-0 xl:flex-[2]">
                <DeliveryDetails
                    setAddress={setAddress}
                    formRef={formRef}
                    onUnavailableItems={promptUnavailable}
                />
                <OrderReview items={checkoutItems} />
            </Flex>

            {/* Right: sticky order summary */}
            <div className="mb-16 md:mb-0 xl:sticky xl:top-4 xl:flex-1">
                <OrderSummary
                    mode="checkout"
                    formRef={formRef}
                    address={address}
                    items={checkoutItems}
                />
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

export default CheckoutList;
