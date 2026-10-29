import { Col, Row } from 'antd';

import useFindProductSuccess from '../../../hooks/rfp/useFindProductSuccess';
import { ProductCard } from '../../common';

const ProductCards = () => {
    const { products } = useFindProductSuccess();
    return (
        <Row gutter={[20, 20]} className="mt-9 mb-2 w-full" align="stretch">
            {products?.map((product, index) => (
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
        </Row>
    );
};

export default ProductCards;
