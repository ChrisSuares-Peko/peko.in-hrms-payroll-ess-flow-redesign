import { Flex, Typography, Col, Row, Empty } from 'antd';

import usePopularCategory from '../../../hooks/popularProduct/usePopularCategory';
import { ProductCard } from '../../common';
import ProductCardSkeleton from '../../common/skeletons/product/ProductCardSkeleton';

const { Text } = Typography;

const PopularProducts = () => {
    const { isLoading, isProducts, popularProducts, total } = usePopularCategory();

    return (
        <Flex vertical justify="flex-start" className="w-full mt-5 md:mt-7 lg:mt-9 lg:gap-2">
            <Flex vertical>
                <Text className="font-semibold text-lg lg:text-2xl text-fontSubHeader">
                    Popular Software
                </Text>
                {!isLoading && isProducts && popularProducts.length > 0 && (
                    <Text className="font-light lg:font-normal text-xs lg:text-sm text-[#868686]">
                        {total} software available
                    </Text>
                )}
            </Flex>

            {isLoading && (
                <Row gutter={[20, 20]} className="mt-5 mb-2 w-full">
                    <ProductCardSkeleton isLoading={isLoading} />
                </Row>
            )}

            {!isLoading && !isProducts && (
                <Flex className="w-full justify-center items-center h-80">
                    <Empty description="Sorry... This service is not available now. Please refresh again" />
                </Flex>
            )}
            {!isLoading && isProducts && popularProducts.length > 0 && (
                <div className="mt-5 mb-2 w-full overflow-hidden px-1 pt-3">
                    <Row gutter={[16, 16]}>
                        {popularProducts.map((product, index) => (
                            <Col
                                key={`${product.product_name}-${index}`}
                                xs={24}
                                sm={12}
                                md={12}
                                lg={8}
                                xl={8}
                                xxl={6}
                            >
                                <div className="w-full h-full flex">
                                    <ProductCard product={product} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}
        </Flex>
    );
};

export default PopularProducts;
