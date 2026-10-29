import { Col, Empty, Flex, Pagination, Row } from 'antd';

import { useCategoryPageContext } from '../../../contexts/CategoryPageContext';
import { ProductCard } from '../../common';
import ProductCardSkeleton from '../../common/skeletons/product/ProductCardSkeleton';

const ProductCards = () => {
    const { isLoading, categoryProducts, filters, noProduct, handlePagination } =
        useCategoryPageContext();

    if (isLoading) {
        return (
            <Row gutter={[20, 20]} className="mt-5 mb-2 w-full">
                <ProductCardSkeleton isLoading={isLoading} />
            </Row>
        );
    }

    if (noProduct) {
        return <Empty description="No Products found." />;
    }

    return (
        <Flex className="mt-9 mb-2 w-full">
            <Row gutter={[20, 20]} align="stretch">
                {categoryProducts?.products.map((product, index) => (
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
                ))}

                <Flex justify="flex-end" className="w-full">
                    <Pagination
                        current={filters.page}
                        total={categoryProducts?.pagination.total}
                        pageSize={filters.limit}
                        showSizeChanger
                        onChange={(page, pageSize) => {
                            handlePagination(page, pageSize);
                        }}
                    />
                </Flex>
            </Row>
        </Flex>
    );
};

export default ProductCards;
