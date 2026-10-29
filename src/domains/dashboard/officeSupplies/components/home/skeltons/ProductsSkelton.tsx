import type { FC } from 'react';

import { Col } from 'antd';

import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductsSkeltonProps {
    loading: boolean;
    itemCount: number;
    /** Desktop columns — matches ProductCard `perRow` (home = 5, category results = 4). */
    perRow?: 4 | 5;
}

const ProductsSkelton: FC<ProductsSkeltonProps> = ({ itemCount, loading, perRow = 5 }) => {
    if (!loading) return null;

    const skeletons = Array.from({ length: itemCount }, (_, index) => (
        <Col
            key={index}
            xs={12}
            sm={12}
            lg={8}
            xl={6}
            className={`flex justify-center overflow-visible ${
                perRow === 5 ? 'xl:!max-w-[20%] xl:!flex-[0_0_20%]' : ''
            }`}
        >
            <ProductCardSkeleton />
        </Col>
    ));

    return <>{skeletons}</>;
};

export default ProductsSkelton;
