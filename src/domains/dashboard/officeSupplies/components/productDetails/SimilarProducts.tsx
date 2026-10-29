import type { FC } from 'react';

import { Row, Typography } from 'antd';

import { useSimilarProducts } from '../../hooks/useSimilarProducts';
import { OndcProduct } from '../../types/products';
import ProductCard from '../home/ProductCard';

/** Similar products = same-category products for the product's city. */
const SimilarProducts: FC<{ product?: OndcProduct | null }> = ({ product }) => {
    const { products } = useSimilarProducts(product);
    if (!products.length) return null;

    return (
        <div className="flex w-full flex-col gap-8">
            <Typography.Text className="text-[18px] font-semibold tracking-[0.4px] text-black">
                Similar products
            </Typography.Text>
            {/* Horizontal gutter was 0, so cards touched edge-to-edge with only their
                own p-3 between them. */}
            <Row justify="start" gutter={[16, 24]} className="!mt-0 overflow-visible">
                {products.slice(0, 4).map(p => (
                    <ProductCard key={p.id} {...p} detail />
                ))}
            </Row>
        </div>
    );
};

export default SimilarProducts;
