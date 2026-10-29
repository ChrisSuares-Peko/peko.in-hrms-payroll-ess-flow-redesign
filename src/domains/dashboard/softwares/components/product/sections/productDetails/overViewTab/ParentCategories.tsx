import { Flex, Skeleton } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

import Tiles from './Tiles';

const ParentCategories = () => {
    const { product, isLoading } = useProductContext();
    if (isLoading) return <Skeleton />;
    if (!product) return null;
    return (
        <Flex gap={12} wrap="wrap">
            {product?.parent_categories.map((parentCategory, index) => (
                <Tiles key={index} title={parentCategory.name} />
            ))}
        </Flex>
    );
};

export default ParentCategories;
