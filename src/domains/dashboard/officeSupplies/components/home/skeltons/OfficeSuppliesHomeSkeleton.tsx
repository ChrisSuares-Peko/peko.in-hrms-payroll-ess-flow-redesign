import type { FC } from 'react';

import { Col, Flex, Row } from 'antd';

import ProductCardSkeleton from './ProductCardSkeleton';

const CarouselSectionSkeleton: FC = () => (
    <Flex vertical className="mt-8 w-full">
        <Flex vertical className="mb-4">
            <div className="h-6 w-56 animate-pulse rounded bg-[#f3f4f6]" />
            <div className="mt-0.5 h-4 w-72 animate-pulse rounded bg-[#f3f4f6]" />
        </Flex>
        <Flex gap={0} className="w-full overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
                <ProductCardSkeleton key={i} bare />
            ))}
        </Flex>
    </Flex>
);

/**
 * Full-page home skeleton — carousels and All Products grid below the category bar.
 */
const OfficeSuppliesHomeSkeleton: FC = () => (
    <Flex vertical className="w-full animate-pulse">
        <CarouselSectionSkeleton />
        <CarouselSectionSkeleton />
        <CarouselSectionSkeleton />

        {/* All Products grid */}
        <div className="mt-8">
            <div className="mb-4 h-6 w-40 rounded bg-[#f3f4f6]" />
            <Row justify="start" gutter={[0, 24]}>
                {Array.from({ length: 12 }).map((_, index) => (
                    <Col
                        key={index}
                        xs={12}
                        sm={12}
                        lg={8}
                        xl={6}
                        className="flex justify-center overflow-visible xl:!max-w-[20%] xl:!flex-[0_0_20%]"
                    >
                        <ProductCardSkeleton />
                    </Col>
                ))}
            </Row>
        </div>
    </Flex>
);

export default OfficeSuppliesHomeSkeleton;
