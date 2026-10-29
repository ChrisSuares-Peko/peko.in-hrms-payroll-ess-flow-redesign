import { useEffect, useRef, useState, type FC } from 'react';

import { Flex, InputNumber, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import cartPlusIcon from '../../assets/productDetails/cart-plus.svg';
import radioOn from '../../assets/productDetails/radio-on.svg';
import truckFastIcon from '../../assets/productDetails/truck-fast.svg';
import { BUY_NOW_PARAM } from '../../hooks/useBuyNowScope';
import { useCartApi } from '../../hooks/useCartApi';
import { useDeliveryEstimate } from '../../hooks/useDeliveryEstimate';
import { OndcProduct } from '../../types/products';
import { discountPercent } from '../../utils/priceInr';
import { formatIsoDuration, getQtyBounds } from '../../utils/productAttributes';

const { Text } = Typography;

const SellerCard: FC<{ name: string; shipsIn?: string }> = ({ name, shipsIn }) => (
    <div className="flex w-full items-center gap-2 rounded-xl border-[0.5px] border-lightRed px-3 py-2 text-left shadow-[0_2px_10px_rgba(0,0,0,0.06)]">
        <img src={radioOn} alt="" className="h-4 w-4 shrink-0" />
        <Flex vertical gap={1} className="min-w-0 flex-1">
            <Flex align="center" gap={4}>
                <Text className="truncate text-[13px] font-semibold text-[#19191d]">{name}</Text>
            </Flex>
            {shipsIn && (
                <Text className="text-[11px] text-[#868686]">Ships within {shipsIn}</Text>
            )}
        </Flex>
    </div>
);

/** Right-side buy box — price/seller/qty/actions use real catalog data only. */
const ProductBuyBox: FC<{ product: OndcProduct }> = ({ product }) => {
    const navigate = useNavigate();
    const { addToCart, buyNow, isLoading, selectedProductId, actionType } = useCartApi();
    const {
        getEstimate,
        estimate,
        cityName,
        isLoading: estimateLoading,
        fetched: estimateFetched,
    } = useDeliveryEstimate();

    const discountPct = discountPercent(product.price, product.maxPrice);
    const { min: minQty, max: maxQty, purchasable } = getQtyBounds(product);
    const outOfStock = !purchasable;
    const [qty, setQty] = useState<number>(minQty);
    
    const busyAdd = isLoading && selectedProductId === product.id && actionType === 'add';
    const busyBuy = isLoading && selectedProductId === product.id && actionType === 'buy';
    const busyAny = isLoading && selectedProductId === product.id;

    const sellerName = product.vendorName?.trim() || 'Seller';
    const shipsIn = formatIsoDuration(product.timeToShip);

    let addLabel = 'Add to Cart';
    if (busyAdd) addLabel = 'Adding…';
    if (outOfStock) addLabel = 'Out of stock';

    let buyLabel = 'Buy Now';
    if (busyBuy) buyLabel = 'Loading…';

    // Seller-declared delivery estimate, fetched automatically on entry (Figma
    // 2101-24994): a green "Delivery by {date} to {city}" pill below the price,
    // a loading line while in flight, or an honest "unavailable" note — never a
    // fabricated date. (Nothing renders until the first result.)
    let estimateNode = null;
    if (estimateLoading) {
        estimateNode = (
            <Text className="text-[13px] text-[#868686]">Checking delivery estimate…</Text>
        );
    } else if (estimate?.expectedDeliveryDate) {
        estimateNode = (
            <Flex
                align="center"
                gap={10}
                className="w-full rounded-xl border-[0.5px] border-solid border-[#b4e8c2] bg-[#f4fff7] px-3 py-2"
            >
                <img src={truckFastIcon} alt="" className="h-4 w-4 shrink-0" />
                <Text className="text-[10px] leading-[1.5] text-[#505050]">
                    Delivery by {dayjs(estimate.expectedDeliveryDate).format('ddd, D MMM')}
                    {cityName ? ` to ${cityName}` : ''}
                </Text>
            </Flex>
        );
    } else if (estimateFetched) {
        estimateNode = (
            <Text className="text-[13px] text-[#868686]">
                Delivery estimate isn&apos;t available for this location.
            </Text>
        );
    }

    // Clamp whatever was typed back into the seller's allowed range.
    const clampQty = (value: number | null) =>
        Math.min(maxQty, Math.max(minQty, Math.floor(value || minQty)));

    // The estimate is already fetched on entry — persist it with the cart item.
    const estimateOpts = {
        estimate: {
            expectedDeliveryDate: estimate?.expectedDeliveryDate ?? null,
            deliveryTat: estimate?.deliveryTat ?? null,
        },
    };
    const handleAdd = () => {
        if (!outOfStock) addToCart(product.id, clampQty(qty), estimateOpts);
    };
    const handleBuyNow = async () => {
        if (outOfStock) return;
        const ok = await buyNow(product.id, clampQty(qty), estimateOpts);
        // Straight to checkout, scoped to this product — anything else already in
        // the cart stays there and is not part of this order. See useBuyNowScope.
        if (ok) {
            navigate(
                `${paths.dashboard.officeSupplies}/${paths.officeSupplies.checkout}` +
                    `?${BUY_NOW_PARAM}=${encodeURIComponent(product.ondcProductId)}`
            );
        }
    };

    // Fetch the delivery estimate automatically on page entry (once per product).
    // The ref guard avoids a duplicate ONDC round-trip from StrictMode's
    // double-invoked effects in dev. Uses minQty — TAT is location-based, so the
    // live quantity input shouldn't refire the call.
    const lastEstimatedId = useRef<string | null>(null);
    useEffect(() => {
        if (lastEstimatedId.current === product.ondcProductId) return;
        lastEstimatedId.current = product.ondcProductId;
        getEstimate(product, minQty);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product.ondcProductId]);

    return (
        <Flex
            vertical
            gap={12}
            className="rounded-3xl bg-white p-4 drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)]"
        >
            {/* Price */}
            <Flex vertical gap={1}>
                <Flex align="center" gap={8} wrap="wrap">
                    <Text className="text-[24px] font-medium leading-tight text-[#19191d]">
                        ₹{formatNumberWithLocalStringWithoutDecimalPoint(product.price)}
                    </Text>
                    {discountPct > 0 && (
                        <Text className="text-sm text-[#868686] line-through">
                            ₹{formatNumberWithLocalStringWithoutDecimalPoint(product.maxPrice)}
                        </Text>
                    )}
                    {discountPct > 0 && (
                        <span className="rounded-[5px] bg-[#43b75d] px-1.5 py-0.5 text-[11px] text-white">
                            {discountPct.toFixed(2)}% OFF
                        </span>
                    )}
                </Flex>
                <Text className="text-[10px] tracking-wide text-[#868686]">
                    Inclusive of all taxes
                </Text>
            </Flex>

            {/* Delivery estimate — directly below the price (Figma 2101-24994) */}
            {estimateNode}

            <div className="h-px w-full bg-[#ededed]" />

            {/* Seller */}
            <Flex vertical gap={8}>
                <Text className="text-[13px] font-semibold text-black">Sold by</Text>
                <SellerCard name={sellerName} shipsIn={shipsIn} />
            </Flex>

            <div className="h-px w-full bg-[#ededed]" />

            {/* Quantity */}
            <Flex vertical gap={4}>
                <InputNumber
                    value={qty}
                    onChange={value => setQty(value ?? minQty)}
                    onBlur={() => setQty(clampQty(qty))}
                    min={minQty}
                    max={!maxQty ? undefined : maxQty}
                    step={1}
                    precision={0}
                    size="middle"
                    disabled={outOfStock || busyAny}
                    placeholder="Enter Qty"
                    className="office-qty-input w-full [&_.ant-input-number-input]:!text-[#19191d] !rounded-lg !border-[#d9d9d9]"
                />
                {!outOfStock && (minQty > 1 || product.maxQuantity != null) && (
                    <Text className="text-[11px] text-[#868686]">
                        {minQty > 1 ? `Min order: ${minQty}` : ''}
                        {minQty > 1 && ' · '}
                        {maxQty>0 ? `Max: ${maxQty}` : " "}
                    </Text>
                )}
            </Flex>

            {/* Actions */}
            <Flex vertical gap={6}>
                <button
                    type="button"
                    onClick={handleAdd}
                    disabled={outOfStock || busyAny}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-lightRed disabled:opacity-60"
                >
                    <img src={cartPlusIcon} alt="" className="h-4 w-4" />
                    <span className="text-[14px] font-medium text-bgOrange2">{addLabel}</span>
                </button>
                <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={outOfStock || busyAny}
                    className="flex h-10 w-full items-center justify-center rounded-lg border border-lightRed bg-lightRed text-[14px] font-medium text-white disabled:opacity-60"
                >
                    {buyLabel}
                </button>
            </Flex>
        </Flex>
    );
};

export default ProductBuyBox;
