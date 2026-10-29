import React from 'react';

import { ShoppingCartOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import cartPlusIcon from '../../assets/productDetails/cart-plus.svg';
import { useCartApi } from '../../hooks/useCartApi';
import { ProductCardProps } from '../../types/products';
import { discountPercent } from '../../utils/priceInr';
import ProductImageView from '../common/ProductImageView';

const { Text } = Typography;

/**
 * Office-supplies product card (Figma-matched): image on a light-grey rounded
 * panel with a green "% OFF" badge, name, "Sold by …", price + strikethrough
 * list price, and an outline Add-Cart button.
 *
 * `bare` renders just the card (for the horizontal carousels); otherwise it is
 * wrapped in a responsive grid `Col` (for the All Products grid).
 * `detail` renders the larger Similar-products variant of the product-details
 * page (240px image panel, 18px price, 101px Add-Card button — per Figma).
 * `perRow` controls desktop columns (home All Products = 5; category results = 4).
 */
const ProductCard: React.FC<
    ProductCardProps & { bare?: boolean; detail?: boolean; perRow?: 4 | 5 }
> = ({
    image,
    name,
    price,
    ondcProductId,
    quantity,
    minQuantity,
    actualPrice,
    soldBy,
    id,
    bare = false,
    detail = false,
    perRow = 5,
}) => {
    const navigate = useNavigate();
    const { addToCart, isLoading, selectedProductId } = useCartApi();
    const discountPct = discountPercent(price, actualPrice);
    // Only a real number means "out of stock". `availableQuantity` is nullable,
    // and `null < 1` is true, so the old `quantity !== undefined` test hid every
    // product whose seller omitted quantity.available.count.
    // Catalog /search rows often report 0 until a later /select — still list them.
    const outOfStock = typeof quantity === 'number' && quantity < 1;
    const adding = isLoading && selectedProductId === id;

    const goToDetails = () =>
        navigate(
            `/${paths.officeSupplies.index}/${paths.officeSupplies.productDetails}/${encodeURIComponent(ondcProductId)}`
        );

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToCart(id, Math.max(1, minQuantity || 1), { ondcProductId });
    };

    const cartIcon = detail ? (
        <img src={cartPlusIcon} alt="" className="h-[13px] w-[13px]" />
    ) : (
        <ShoppingCartOutlined />
    );

    const card = (
        <Flex
            vertical
            gap={0}
            className="h-full w-full cursor-pointer rounded-2xl bg-white p-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            onClick={goToDetails}
            role="button"
        >
            <div
                className={`relative flex aspect-[49/50] w-full items-center justify-center overflow-hidden bg-[#f7f7f7] ${
                    detail ? 'rounded-2xl' : 'rounded-2xl'
                }`}
            >
                <ProductImageView
                    src={image}
                    alt={name}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 ease-in-out hover:scale-105"
                />
                {discountPct > 0 && (
                    // Tighter inset/type on phones: at the designed size this badge
                    // covered over half of a ~126px card image.
                    <span
                        className={`absolute right-1.5 top-1.5 whitespace-nowrap rounded-lg border-[0.5px] border-[#d4fbdc] bg-white px-1.5 text-[10px] font-medium text-[#43b75d] sm:right-3 sm:top-3 sm:px-2 sm:text-xs ${
                            detail ? 'py-1' : 'py-0.5'
                        }`}
                    >
                        {discountPct.toFixed(2)}% OFF
                    </span>
                )}
            </div>

            <Flex vertical gap={3} className={`flex-1 ${detail ? 'pt-2' : 'pt-3'}`}>
                <Flex vertical gap={1}>
                    <Text
                        className={`line-clamp-2 font-semibold leading-snug text-[#19191d] ${
                            detail ? 'text-sm' : 'text-sm sm:text-base'
                        }`}
                    >
                        {name}
                    </Text>
                    {soldBy && (
                        <Text
                            className={`text-[#868686] ${
                                detail ? 'text-xs' : 'text-xs sm:text-[13px]'
                            }`}
                        >
                            Sold by <span className="text-black">{soldBy}</span>
                        </Text>
                    )}
                </Flex>

                {/* wrap: on a ~136px phone card the price pair and the button cannot
                    share a line, and `nowrap` + `overflow-hidden` with no ellipsis used
                    to slice the price mid-digit — a clipped ₹1,25,000 reads as a lower
                    price. Let the button drop below instead, and truncate visibly. */}
                <Flex
                    align="center"
                    justify="space-between"
                    gap={4}
                    wrap="wrap"
                    className={`mt-auto ${detail ? 'pt-2' : 'pt-3'}`}
                >
                    <Flex align="baseline" gap={detail ? 8 : 4} className="min-w-0">
                        <Text
                            className={`min-w-0 truncate text-[#19191d] ${
                                detail ? 'text-[14px] font-medium' : 'text-[15px] font-semibold'
                            }`}
                        >
                            ₹{formatNumberWithLocalStringWithoutDecimalPoint(price)}
                        </Text>
                        {discountPct > 0 && (
                            <Text
                                className={`min-w-0 truncate text-[#868686] line-through ${
                                    detail ? 'text-[12px]' : 'text-[11px]'
                                }`}
                            >
                                ₹{formatNumberWithLocalStringWithoutDecimalPoint(actualPrice)}
                            </Text>
                        )}
                    </Flex>
                    <Button
                        size="small"
                        loading={adding}
                        disabled={outOfStock}
                        icon={!adding ? cartIcon : undefined}
                        onClick={handleAddToCart}
                        className={`shrink-0 !rounded-lg !border-lightRed !font-medium !text-bgOrange2 ${
                            detail
                                ? '!flex !h-auto !w-auto !items-center !justify-center !px-2 !py-1.5 !text-[10px] sm:!w-[88px]'
                                : '!h-8 !px-1.5 !text-[10px] sm:!px-2 sm:!text-[11px]'
                        }`}
                    >
                        {outOfStock ? 'Out of stock' : 'Add to Cart'}
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );

    if (bare) return card;

    return (
        <Col
            xs={detail ? 12 : 12}
            sm={detail ? 12 : 12}
            lg={detail ? 8 : 8}
            xl={detail ? 6 : 6}
            className={`flex overflow-visible ${
                !detail && perRow === 5 ? 'xl:!max-w-[20%] xl:!flex-[0_0_20%]' : ''
            }`}
        >
            {card}
        </Col>
    );
};

export default ProductCard;
