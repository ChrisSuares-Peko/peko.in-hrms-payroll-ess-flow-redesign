import type { FC } from 'react';

import { Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/hooks';

import { useSellerGroups } from '../../hooks/useSellerGroups';
import { CartItem } from '../../types/cartTypes';
import { formatInr } from '../../utils/priceInr';
import DeliveryEstimateBanner from '../DeliveryEstimateBanner';

const { Text } = Typography;

/**
 * Read-only per-seller order breakdown for the checkout page (Figma
 * 2342-24561) — no images/steppers/delete (that's the cart page's job),
 * unavailable items excluded since they can't be part of a real order.
 */
const OrderReview: FC<{ items: CartItem[] }> = ({ items }) => {
    const { groups } = useSellerGroups(items);
    // Only present once the cart has been validated with sellers this session
    // (see cartSlice.setData — any cart change nulls this out again).
    const validation = useAppSelector(state => state.reducer.cart.validation);

    return (
        <Flex
            vertical
            gap={20}
            className="w-full rounded-3xl bg-white p-6 drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)]"
        >
            <Text className="text-[18px] font-semibold leading-[26px] text-[#101828]">
                Order review
            </Text>
            {groups.map(([vendorName, groupItems], i) => {
                const itemsTotal = groupItems.reduce(
                    (sum, item) => sum + (Number(item.totalPrice) || 0),
                    0
                );
                const matchedGroup = validation?.groups?.find(g => g.vendorName === vendorName);
                const deliveryCharge = matchedGroup?.quote?.deliveryCharge;
                // The seller's quote total already includes packing/tax/misc rows;
                // items + delivery alone understates what will actually be charged.
                // The full row-by-row breakdown appears in the payment summary below.
                const sellerTotal =
                    matchedGroup?.quote?.total ??
                    (deliveryCharge != null ? itemsTotal + deliveryCharge : itemsTotal);
                // Prefer the add-to-cart saved estimate (worst-case across the
                // seller's items); fall back to a fresh validation.
                const savedDeliveryDate =
                    groupItems
                        .map(item => item.expectedDeliveryDate)
                        .filter((d): d is string => !!d)
                        .sort()
                        .at(-1) ?? null;
                const deliveryDate = savedDeliveryDate ?? matchedGroup?.expectedDeliveryDate ?? null;
                return (
                    <Flex
                        vertical
                        gap={12}
                        key={vendorName}
                        className={
                            i < groups.length - 1
                                ? 'border-b border-solid border-[#e4e4e7] pb-5'
                                : ''
                        }
                    >
                        <Flex align="start" justify="space-between" gap={12} className="w-full">
                            <Text className="min-w-0 flex-1 text-[15px] font-medium text-[#101828]">
                                Sold by {vendorName}
                            </Text>
                            <Text className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-[#252430]">
                                {formatInr(sellerTotal)}
                            </Text>
                        </Flex>
                        {groupItems.map((item, idx) => (
                            <Flex
                                key={item.productId ?? `${item.productName}-${idx}`}
                                align="start"
                                justify="space-between"
                                gap={12}
                                className="w-full"
                            >
                                <Text className="min-w-0 flex-1 text-[14px] text-[#4a5565]">
                                    {item.productName} × {item.productQuantity}
                                </Text>
                                <Text className="shrink-0 whitespace-nowrap text-[14px] text-[#252430]">
                                    {formatInr(item.totalPrice)}
                                </Text>
                            </Flex>
                        ))}
                        <DeliveryEstimateBanner expectedDeliveryDate={deliveryDate} />
                    </Flex>
                );
            })}
        </Flex>
    );
};

export default OrderReview;
