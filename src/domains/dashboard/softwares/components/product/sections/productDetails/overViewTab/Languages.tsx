import { Flex, Skeleton } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

import Tiles from './Tiles';

const Languages = () => {
    const { product, isLoading } = useProductContext();
    if (isLoading) return <Skeleton />;
    if (!product) return null;
    return (
        <Flex gap={12} wrap="wrap">
            {product?.languages.map((language, index) => (
                <Tiles key={index} title={language.name} />
            ))}
        </Flex>
    );
};

export default Languages;
