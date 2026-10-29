import { StarFilled } from '@ant-design/icons';
import { Button, Flex, Typography, Tooltip } from 'antd';

import defalultProductCardImage from '@src/domains/dashboard/softwares/assets/images/defalultProductCardImage.svg';

import ProductCardOverView from './productCardOverView';
import useProductCard from '../../hooks/general/useProductCard';
import { IProductCard } from '../../types';

const { Text, Link, Paragraph } = Typography;

type Props = {
    product: IProductCard;
};

const ProductCard = ({ product }: Props) => {
    const { cardImageSize, routeToProductPage } = useProductCard(product);

    return (
        <Flex
            vertical
            className="w-full h-full rounded-3xl p-6 bg-white shadow-[0_10px_35px_rgb(0,0,0,0.04)] border-0 justify-between"
        >
            {/* TOP SECTION */}
            <Flex vertical className="gap-6 flex-1">
                {/* Header Row */}
                <Flex justify="space-between" align="start" className="gap-4">
                    {/* LEFT SIDE */}
                    <Flex className="flex-1 min-w-0 gap-4 items-start">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            <img
                                src={product.logo_url}
                                width={cardImageSize}
                                height={cardImageSize}
                                alt={product.product_name}
                                className="object-contain object-center"
                                onError={e => {
                                    e.currentTarget.src = defalultProductCardImage;
                                }}
                            />
                        </div>

                        {/* Text Content */}
                        <Flex vertical className="flex-1 min-w-0">
                            <Tooltip title={product.product_name}>
                                <Text className="text-sm font-semibold text-[#27272E] truncate">
                                    {product.product_name}
                                </Text>
                            </Tooltip>

                            <Tooltip title={`By ${product.company ?? ''}`}>
                                <Text className="font-normal text-xs text-[#6A7282] truncate w-full">
                                    By{' '}
                                    <span className="font-medium text-[#364153]">
                                        {product.company ?? 'Unknown'}
                                    </span>
                                </Text>
                            </Tooltip>

                            <div className="inline-flex min-w-0">
                                <Tooltip title={product.website}>
                                    <Link
                                        href={`${product.website}`}
                                        target="_blank"
                                        className="font-normal text-xs !text-[#6A7282] truncate"
                                    >
                                        {product.website}
                                    </Link>
                                </Tooltip>
                            </div>
                        </Flex>
                    </Flex>
                </Flex>

                {/* Overview Section */}
                <Flex className="w-full min-h-[64px]">
                    <ProductCardOverView text={product.overview} product={product} />
                </Flex>
            </Flex>

            {/* BOTTOM SECTION */}
            <Flex className="w-full flex-col sm:flex-row gap-2 sm:gap-0 justify-between">
                <Flex className="w-full flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
                    {/* Rating */}
                    <Flex className="w-full sm:w-auto justify-center sm:justify-start items-center gap-2">
                        <Flex className="gap-1 items-center">
                            <Paragraph className="font-medium text-sm text-[#374151] mb-0">
                                {product.ratings?.overall_rating != null
                                    ? Number(product.ratings.overall_rating).toFixed(1)
                                    : '0.0'}
                            </Paragraph>
                            <StarFilled className="text-yellow-500 text-sm" />
                        </Flex>

                        <Text className="font-normal text-xs text-[#374151]">
                            ({product.ratings?.total_reviews ?? 0} reviews)
                        </Text>
                    </Flex>

                    {/* View Button */}
                    <Button
                        onClick={() => {
                            routeToProductPage(product.weburl);
                        }}
                        className="w-full sm:w-24 h-9 rounded-md bg-[#FFFFFF] border-lightRed text-lightRed"
                    >
                        View
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default ProductCard;
