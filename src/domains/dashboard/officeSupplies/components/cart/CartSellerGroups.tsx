import type { FC, ReactNode } from 'react';
import { createContext, useContext } from 'react';

import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Flex, Spin, Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/hooks';

import { useCartApi } from '../../hooks/useCartApi';
import { useRemoveCartItemModal } from '../../hooks/useRemoveCartItemModal';
import { useSellerGroups } from '../../hooks/useSellerGroups';
import { CartItem } from '../../types/cartTypes';
import { discountPercent, formatInr } from '../../utils/priceInr';
import { getQtyBounds } from '../../utils/productAttributes';
import { getItemsTotal, getOtherChargeRows } from '../../utils/quoteSummary';
import ClampedTextWithMore from '../common/ClampedTextWithMore';
import ProductImageView from '../common/ProductImageView';
import DeliveryEstimateBanner from '../DeliveryEstimateBanner';

const { Text } = Typography;

/**
 * Opens the confirm-to-remove dialog for a row. Provided once by
 * CartSellerGroups so the stepper and the trash button — nested three levels
 * down — share one modal instead of each deleting outright.
 */
const RemovePromptContext = createContext<(item: CartItem) => void>(() => {});

const savings = (item: CartItem) =>
    item.maxPrice > item.price ? (item.maxPrice - item.price) * item.productQuantity : 0;

const savePercent = (item: CartItem) => discountPercent(item.price, item.maxPrice);

/** Column label used in the items table header row. */
const ColHeading: FC<{ children: string }> = ({ children }) => (
    <Text className="block px-6 py-2.5 text-xs font-medium leading-[1.5] text-[#475156]">
        {children}
    </Text>
);

const ProductCell: FC<{ item: CartItem }> = ({ item }) => (
    <Flex align="center" gap={16} className="min-w-0">
        <Flex
            align="center"
            justify="center"
            className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f8f8f8]"
        >
            <ProductImageView
                src={item.image}
                alt={item.productName}
                className="h-full w-full object-contain"
                placeholderClassName="h-[50%] w-[50%] opacity-40"
            />
        </Flex>
        <div className="min-w-0 flex-1">
            <ClampedTextWithMore
                text={item.productName}
                clampClass="line-clamp-2"
                textClassName="text-[16px] font-medium leading-[21px] text-black"
                moreClassName="text-sm font-semibold text-lightRed"
                as="div"
            />
        </div>
    </Flex>
);

/**
 * The column headings live in a `hidden md:grid` row with no mobile counterpart, so
 * below md the row showed two bare rupee figures with nothing to say which was the
 * unit price and which the line total. These inline labels only render there.
 */
const CellLabel: FC<{ children: string }> = ({ children }) => (
    <Text className="text-xs text-[#868686] md:hidden">{children}</Text>
);

const PriceCell: FC<{ item: CartItem }> = ({ item }) => (
    <Flex vertical gap={4}>
        <CellLabel>Price</CellLabel>
        <Text className="text-[16px] font-normal text-black">{formatInr(item.price)}</Text>
        {savings(item) > 0 && (
            <Text className="text-xs text-[#43b75d]">
                Save {formatInr(item.maxPrice - item.price)} ({savePercent(item).toFixed(2)}%)
            </Text>
        )}
    </Flex>
);

const SubTotalCell: FC<{ item: CartItem; onDelete?: () => void; deleting?: boolean }> = ({
    item,
    onDelete,
    deleting,
}) => (
    <Flex align="center" justify="space-between" gap={12} className="w-full">
        <Flex vertical gap={4} align="start">
            <CellLabel>Sub-total</CellLabel>
            <Text className="text-[18px] font-semibold text-black">
                {formatInr(item.totalPrice)}
            </Text>
            {item.maxPrice > item.price && (
                <Text delete className="text-[14px] text-[#868686]">
                    {formatInr(item.maxPrice * item.productQuantity)}
                </Text>
            )}
        </Flex>
        {onDelete &&
            (deleting ? (
                <Spin size="small" />
            ) : (
                <button
                    type="button"
                    aria-label="Remove from cart"
                    onClick={onDelete}
                    className="text-[19px] text-lightRed"
                >
                    <DeleteOutlined />
                </button>
            ))}
    </Flex>
);

/**
 * Red-bordered −/qty/+ stepper (Figma). `+` caps at getQtyBounds' ceiling — the
 * smallest of stock, the seller's max order quantity and our per-item cap;
 * decrementing below the seller's minimum order quantity (default 1) asks before
 * removing the item.
 */
const QtyStepper: FC<{ item: CartItem }> = ({ item }) => {
    const { updateCart, isLoading, selectedProductId } = useCartApi();
    const promptRemove = useContext(RemovePromptContext);
    const busy = isLoading && selectedProductId === item.productId;
    const { min: minQty, max: maxQty } = getQtyBounds(item);
    const atMax = item.productQuantity >= maxQty;

    if (!item.productId) return null;
    return (
        <Flex vertical gap={4} className="w-fit">
            <Flex
                align="center"
                gap={12}
                className="w-fit rounded-lg border-[0.5px] border-solid border-lightRed px-3 py-2"
            >
                <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={busy}
                    onClick={() =>
                        item.productQuantity <= minQty
                            ? promptRemove(item)
                            : updateCart(item.productId!, 'decrease')
                    }
                    className="flex items-center text-[12px] text-[#FF4F4F] disabled:opacity-40"
                >
                    <MinusOutlined />
                </button>
                {busy ? (
                    <Spin size="small" />
                ) : (
                    <Text className="text-[14px] font-semibold text-black">
                        {item.productQuantity}
                    </Text>
                )}
                <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={busy || atMax}
                    onClick={() => updateCart(item.productId!, 'increase')}
                    className="flex items-center text-[12px] text-[#FF4F4F] disabled:opacity-40"
                >
                    <PlusOutlined />
                </button>
            </Flex>
            {minQty > 1 && (
                <div className="w-fit rounded bg-[#fff7eb] px-2 py-1">
                    <Text className="text-[10px] text-[#cb8000]">Min. order: {minQty} units</Text>
                </div>
            )}
        </Flex>
    );
};

/** Rounded seller card frame: grey (or custom) header + children. */
const GroupCard: FC<{ header: ReactNode; headerClass?: string; children: ReactNode }> = ({
    header,
    headerClass = 'bg-[#f9fafb]',
    children,
}) => (
    <div className="w-full drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)]">
        <div className="w-full overflow-hidden rounded-3xl bg-white">
            <Flex
                align="center"
                justify="space-between"
                className={`border-b border-solid border-[#e4e4e7] px-4 py-3 sm:px-6 sm:py-4 ${headerClass}`}
            >
                {header}
            </Flex>
            {children}
        </div>
    </div>
);

/** One cart row. Desktop = 4-column grid matching the sub-headings; mobile = stacked. */
const ItemRow: FC<{
    item: CartItem;
    last: boolean;
    quantityCell: ReactNode;
    /** false for "No longer available" rows — only the card-level clear-all icon applies there */
    allowDelete?: boolean;
}> = ({ item, last, quantityCell, allowDelete = true }) => {
    const { isLoading, selectedProductId } = useCartApi();
    const promptRemove = useContext(RemovePromptContext);
    const deleting = isLoading && selectedProductId === item.productId;
    const onDelete = allowDelete && item.productId ? () => promptRemove(item) : undefined;
    const borderClass = last ? '' : 'border-b border-solid border-[#e4e4e7]';

    return (
        <>
            {/* Desktop row */}
            <div
                className={`hidden md:grid grid-cols-[minmax(0,5fr)_2fr_2fr_3fr] items-center ${borderClass}`}
            >
                <div className="p-6">
                    <ProductCell item={item} />
                </div>
                <div className="p-6">
                    <PriceCell item={item} />
                </div>
                <div className="p-6">{quantityCell}</div>
                <div className="p-6">
                    <SubTotalCell item={item} onDelete={onDelete} deleting={deleting} />
                </div>
            </div>

            {/* Mobile row */}
            <Flex vertical gap={12} className={`p-4 md:hidden ${borderClass}`}>
                <ProductCell item={item} />
                <Flex align="center" justify="space-between" gap={12} wrap="wrap">
                    <PriceCell item={item} />
                    {quantityCell}
                </Flex>
                <SubTotalCell item={item} onDelete={onDelete} deleting={deleting} />
            </Flex>
        </>
    );
};

/** Per-seller card: items table + Items total / Seller total. */
const SellerCard: FC<{ vendorName: string; items: CartItem[] }> = ({ vendorName, items }) => {
    const localItemsTotal = items.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);
    const unitCount = items.reduce((sum, i) => sum + (Number(i.productQuantity) || 0), 0);
    // Only present once the cart has been validated with sellers this session
    // (see cartSlice.setData — any cart change nulls this out again).
    const validation = useAppSelector(state => state.reducer.cart.validation);
    const matchedGroup = validation?.groups?.find(g => g.vendorName === vendorName);
    const quote = matchedGroup?.quote;
    const deliveryCharge = quote?.deliveryCharge;
    // Once validated, the seller's quote is the authority on price — its total
    // already includes packing/tax/misc rows, which items + delivery alone would
    // leave out and understate what the user is about to pay.
    const otherChargeRows = getOtherChargeRows(quote);
    const itemsTotal = getItemsTotal(quote, localItemsTotal);
    const sellerTotal =
        quote?.total ?? (deliveryCharge != null ? localItemsTotal + deliveryCharge : localItemsTotal);
    // Prefer the estimate saved at add-to-cart (shows immediately, survives cart
    // changes); fall back to a fresh validation. Worst-case (latest) across the
    // seller's items so the promise holds for the whole shipment.
    const savedDeliveryDate =
        items
            .map(i => i.expectedDeliveryDate)
            .filter((d): d is string => !!d)
            .sort()
            .at(-1) ?? null;
    const deliveryDate = savedDeliveryDate ?? matchedGroup?.expectedDeliveryDate ?? null;

    return (
        <GroupCard
            header={
                <>
                    {/* A long seller name used to push the item count into a second line */}
                    <Text className="min-w-0 truncate text-[14px] font-semibold text-black">
                        {vendorName}
                    </Text>
                    <Text className="shrink-0 text-[15px] text-[#868686]">
                        {unitCount} {unitCount === 1 ? 'item' : 'items'}
                    </Text>
                </>
            }
        >
            {/* Column sub-headings (desktop) */}
            <div className="hidden md:grid grid-cols-[minmax(0,5fr)_2fr_2fr_3fr] border-b border-solid border-[#e4e7e9]">
                <ColHeading>Products</ColHeading>
                <ColHeading>Price</ColHeading>
                <ColHeading>Quantity</ColHeading>
                <ColHeading>Sub-total</ColHeading>
            </div>

            {items.map((item, idx) => (
                <ItemRow
                    key={item.productId ?? `${item.productName}-${idx}`}
                    item={item}
                    last={idx === items.length - 1}
                    quantityCell={<QtyStepper item={item} />}
                />
            ))}

            {/* Seller totals */}
            <div className="border-t border-solid border-[#e4e4e7] p-4 sm:p-6">
                <Flex vertical gap={15}>
                    <Flex align="center" justify="space-between">
                        <Text className="text-[16px] text-[#4a5565]">Items total</Text>
                        <Text className="text-[16px] text-[#252430]">
                            {formatInr(itemsTotal)}
                        </Text>
                    </Flex>
                    {deliveryCharge != null && (
                        <Flex align="center" justify="space-between">
                            <Text className="text-[16px] text-[#4a5565]">Delivery</Text>
                            <Text className="text-[16px] text-[#252430]">
                                {formatInr(deliveryCharge)}
                            </Text>
                        </Flex>
                    )}
                    {otherChargeRows.map(row => (
                        <Flex key={row.label} align="center" justify="space-between">
                            <Text className="text-[16px] text-[#4a5565]">{row.label}</Text>
                            <Text className="text-[16px] text-[#252430]">
                                {formatInr(row.amount)}
                            </Text>
                        </Flex>
                    ))}
                    <div className="h-px w-full bg-[#e4e4e7]" />
                    <Flex align="center" justify="space-between">
                        <Text className="text-[16px] font-semibold text-[#101828]">
                            Seller total
                        </Text>
                        <Text className="text-[16px] font-semibold text-[#252430]">
                            {formatInr(sellerTotal)}
                        </Text>
                    </Flex>
                    <DeliveryEstimateBanner expectedDeliveryDate={deliveryDate} />
                </Flex>
            </div>
        </GroupCard>
    );
};

/** Items whose listing disappeared / went out of stock — red header, no stepper. */
const UnavailableCard: FC<{ items: CartItem[] }> = ({ items }) => {
    // One backend call clears every unavailable item — per-item deletes can't
    // address legacy snapshots whose productId is null.
    const { clearUnavailableItems, isLoading: isDeleting } = useCartApi();

    return (
        <GroupCard
            headerClass="bg-[#fef2f2]"
            header={
                <>
                    <Text className="text-[14px] font-semibold text-[#ef4444]">
                        No longer available
                    </Text>
                    {isDeleting ? (
                        <Spin size="small" />
                    ) : (
                        <button
                            type="button"
                            aria-label="Remove unavailable items"
                            onClick={() => clearUnavailableItems()}
                            className="text-[19px] text-lightRed"
                        >
                            <DeleteOutlined />
                        </button>
                    )}
                </>
            }
        >
            <div className="hidden md:grid grid-cols-[minmax(0,5fr)_2fr_2fr_3fr] border-b border-solid border-[#e4e7e9]">
                <ColHeading>Products</ColHeading>
                <ColHeading>Price</ColHeading>
                <ColHeading>Quantity</ColHeading>
                <ColHeading>Sub-total</ColHeading>
            </div>
            {items.map((item, idx) => (
                <ItemRow
                    key={item.productId ?? `${item.productName}-${idx}`}
                    item={item}
                    last={idx === items.length - 1}
                    allowDelete={false}
                    quantityCell={
                        <Flex
                            align="center"
                            gap={4}
                            className="w-fit rounded-lg border-[0.5px] border-solid border-[#cbd5e1] px-3 py-2"
                        >
                            <Text className="text-[14px] text-black">x</Text>
                            <Text className="text-[14px] font-semibold text-black">
                                {item.productQuantity}
                            </Text>
                        </Flex>
                    }
                />
            ))}
        </GroupCard>
    );
};

/**
 * Cart items grouped into one rounded card per seller (Figma 2304-27306), with
 * unavailable items collected into a red "No longer available" card at the end.
 */
const CartSellerGroups: FC<{ items: CartItem[] }> = ({ items }) => {
    const { groups, unavailable } = useSellerGroups(items);
    const { removeOpen, removeItem, promptRemove, dismissRemove, confirmRemove, removing } =
        useRemoveCartItemModal();

    return (
        <RemovePromptContext.Provider value={promptRemove}>
            <Flex vertical gap={24} className="w-full">
                {groups.map(([vendorName, groupItems]) => (
                    <SellerCard key={vendorName} vendorName={vendorName} items={groupItems} />
                ))}
                {unavailable.length > 0 && <UnavailableCard items={unavailable} />}
            </Flex>
            <ConfirmationModal
                isOpen={removeOpen}
                handleCancel={dismissRemove}
                handleSubmit={confirmRemove}
                isLoading={removing}
                title="Remove this item?"
                description={
                    removeItem
                        ? `"${removeItem.productName}" will be removed from your cart.`
                        : undefined
                }
            />
        </RemovePromptContext.Provider>
    );
};

export default CartSellerGroups;
