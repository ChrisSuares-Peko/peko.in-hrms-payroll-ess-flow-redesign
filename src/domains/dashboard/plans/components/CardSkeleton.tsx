import type { FC } from 'react';

import { Col, Flex, Skeleton } from 'antd';

interface ProductsSkeltonProps {
    loading: boolean;
    itemCount: number;
}
const CardSkeleton: FC<ProductsSkeltonProps> = ({ itemCount, loading }) => {
    const skeletons = Array.from({ length: itemCount }, (_, index) => (
        <Col key={index} xs={24} sm={12} md={10} lg={11} xl={8} className="pt-3">
            <ProductsSkeltonItem />
        </Col>
    ));

    return <>{loading && skeletons}</>;
};

const ProductsSkeltonItem: FC = () => (
    <Flex align="center" className="w-full mb-6" vertical gap={10}>
        <Flex className="w-full rounded-lg text-skeltonGray bg-skeltonGray animate-pulse min-h-32">
            .
        </Flex>
        <Skeleton title={false} round paragraph={{ rows: 12 }} />
    </Flex>
);

export default CardSkeleton;
