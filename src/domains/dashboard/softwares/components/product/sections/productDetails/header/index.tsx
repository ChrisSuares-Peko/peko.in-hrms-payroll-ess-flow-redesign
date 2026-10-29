import { Flex, Image, Typography } from 'antd';

import defalultProductCardImage from '@src/domains/dashboard/softwares/assets/images/defalultProductCardImage.svg';
import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

import RatingAndReview from './RatingAndReview';
import ProductTopSectionSkeleton from '../../../../common/skeletons/product/ProductTopSectionSkeleton';

const { Text, Link } = Typography;

const Header = () => {
    const { product, isLoading } = useProductContext();

    if (isLoading) return <ProductTopSectionSkeleton />;
    if (!product) return null;

    return (
        <Flex className="w-full flex-col sm:flex-row justify-center sm:justify-start gap-4">
            {/* Logo */}
            <Flex align="center" justify="center" className="shrink-0">
                <Image
                    src={product.logo_url}
                    preview={false}
                    className="!w-16 !h-16 sm:!w-20 sm:!h-20 rounded-xl object-contain"
                    onError={e => {
                        e.currentTarget.src = defalultProductCardImage;
                    }}
                />
            </Flex>

            {/* Info */}
            <Flex vertical gap={4} className="items-center sm:items-start">
                <Text className="font-bold text-xl sm:text-2xl text-[#27272E] leading-tight truncate">
                    {product.product_name}
                </Text>

                <Text className="font-normal text-xs text-[#6A7282]">
                    By <span className="font-medium text-[#364153]">{product.company}</span>
                </Text>

                <Link
                    href={`${product.website}${product.weburl}`}
                    target="_blank"
                    className="font-normal text-xs !text-[#425466] truncate block"
                >
                    {product.website}
                </Link>

                {/* Rating */}
                <Flex className="mt-1 flex-wrap gap-2 sm:gap-8 items-center sm:items-center flex-col sm:flex-row">
                    <RatingAndReview />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default Header;
