import { type FC } from 'react';

import { Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import { ProductCardProps } from '../../types/products';
import { discountPercent } from '../../utils/priceInr';
import ProductImageView from '../common/ProductImageView';

const { Text } = Typography;

/**
 * Compact search-suggestion card (Figma-matched): image, single-line
 * truncated name, price + discount badge only. No "Sold by", strikethrough
 * price, or Add-to-Cart button — this card is click-to-navigate only, used
 * inside the search-bar autocomplete dropdown's 6-column grid.
 *
 * Missing images use the same placeholder as ProductCard so imageless hits
 * still occupy a cell (the dropdown stays open only when there are hits).
 */
const SearchSuggestionCard: FC<ProductCardProps> = ({
    image,
    name,
    price,
    actualPrice,
    ondcProductId,
}) => {
    const navigate = useNavigate();

    const discountPct = discountPercent(price, actualPrice);

    const goToDetails = () =>
        navigate(
            `/${paths.officeSupplies.index}/${paths.officeSupplies.productDetails}/${encodeURIComponent(ondcProductId)}`
        );

    return (
        <Flex
            vertical
            gap={3}
            role="button"
            onClick={goToDetails}
            className="w-full min-w-0 cursor-pointer"
        >
            <div className="flex h-[104px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#f7f7f7]">
                <ProductImageView
                    src={image}
                    alt={name}
                    loading="lazy"
                    className="max-h-[80%] max-w-[80%] object-contain"
                />
            </div>
            <Text
                title={name}
                className="truncate text-[12px] font-semibold tracking-[0.33px] text-[#19191d]"
            >
                {name}
            </Text>
            <Flex align="center" gap={6}>
                <Text className="whitespace-nowrap text-[12px] font-medium tracking-[0.33px] text-[#19191d]">
                    ₹{formatNumberWithLocalStringWithoutDecimalPoint(price)}
                </Text>
                {discountPct > 0 && (
                    <span className="whitespace-nowrap rounded-[3px] border-[0.27px] border-[#d4fbdc] bg-[#e8ffed] px-1 text-[8px] tracking-[0.22px] text-[#43b75d]">
                        {discountPct.toFixed(2)}% OFF
                    </span>
                )}
            </Flex>
        </Flex>
    );
};

export default SearchSuggestionCard;
