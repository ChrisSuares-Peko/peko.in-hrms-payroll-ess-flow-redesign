import React from 'react';

import { OndcProduct } from '../../types/products';

type RelatedProductsProps = {
    products: OndcProduct[];
};

/**
 * ONDC product detail does not return related products, so this section is
 * hidden. Kept as a component so the details page composition is unchanged.
 */
const RelatedProducts: React.FC<RelatedProductsProps> = ({ products }) => {
    if (!products?.length) return null;
    return null;
};

export default RelatedProducts;
