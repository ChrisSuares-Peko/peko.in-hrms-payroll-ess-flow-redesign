import { Flex, Rate, Skeleton, Typography } from 'antd';

import { useProductContext } from '../../../../../contexts/ProductContext';

const { Text } = Typography;
type Props = {
    ratingClass?: string;
    starClass?: string;
    reviewClass?: string;
};

const RatingAndReview = ({ ratingClass = '', starClass = '', reviewClass = '' }: Props) => {
    const { product, isLoading } = useProductContext();
    if (isLoading) return <Skeleton />;
    if (!product) return null;
    return (
        <Flex justify="flex-start" align="center" className="gap-2">
            <Text className={`${'font-medium text-xs text-[#374151]'}${ratingClass}`}>
                {' '}
                {Number(product.ratings.overall_rating.toFixed(1))}
            </Text>
            <Rate
                allowHalf
                disabled
                value={Number(product.ratings.overall_rating)}
                className="text-xs text-[#FFA432] [&_.ant-rate-star]:!me-0.5"
            />
            <Text className="font-medium text-xs text-[#374151]">
                ( {product.ratings.total_reviews} reviews )
            </Text>
        </Flex>
    );
};

export default RatingAndReview;
