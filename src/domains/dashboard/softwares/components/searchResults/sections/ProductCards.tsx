import { Col, Empty, Flex, Row } from 'antd';

import { useSearchResultContext } from '../../../contexts/SearchPageContext';
import { ProductCard } from '../../common';
import ProductCardSkeleton from '../../common/skeletons/product/ProductCardSkeleton';

const ProductCards = () => {
    const { products, isLoading } = useSearchResultContext();
    return (
        <Row gutter={[20, 20]} className="mt-9 mb-2 w-full" align="stretch">
            {isLoading ? (
                <ProductCardSkeleton isLoading={isLoading} />
            ) : (
                <>
                    {products.length > 0 ? (
                        products?.map((product, index) => (
                            <Col
                                key={`${product?.product_name}-${index}`}
                                xs={24}
                                sm={24}
                                md={12}
                                lg={8}
                                xl={8}
                                xxl={6}
                                className="flex"
                            >
                                <div className="w-full h-full flex">
                                    <ProductCard product={product} />
                                </div>
                            </Col>
                        ))
                    ) : (
                        <Flex className="w-full h-80 justify-center items-center">
                            <Empty description="No matching products found. Please try a different search term." />
                        </Flex>
                    )}
                </>
            )}
        </Row>
    );
};

export default ProductCards;
