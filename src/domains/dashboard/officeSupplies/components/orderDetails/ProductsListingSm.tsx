import type { FC } from 'react';

import { Flex, Row, Typography, Space, Image } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import ReturnSection from './ReturnSection';
import defaultImage from '../../assets/images/defaultImage.png';

const { Text } = Typography;

interface ProductsListingSmProps {
    getOrderDetails: any;
}

const ProductsListingSm: FC<ProductsListingSmProps> = ({ getOrderDetails }) => {
    const orderedProducts = useAppSelector(state => state.reducer.orderDetails.orderedProducts);

    return (
        <Flex vertical>
            {orderedProducts.map((product, i) => (
                <Flex
                    key={i}
                    align="top"
                    justify="space-between"
                    className="bg-bgF7F9Fb p-4 mt-6 rounded-md  "
                >
                    <Space direction="vertical">
                        <Row>
                            {/* <Text className="font-medium text-xs">Delivered on: Dec 23, 2023</Text> */}
                            <Text className="text-xs">{product.productName}</Text>
                        </Row>
                        <Flex vertical gap={10}>
                            <Text className="text-xs">Total Price: </Text>
                            <Text className="text-xs">
                                {' '}
                                AED {formatNumberWithLocalString(Number(product.totalPrice))} ({' '}
                                {product.productQuantity} *{' '}
                                {formatNumberWithLocalString(
                                    Number(product.totalPrice / product.productQuantity)
                                )}{' '}
                                ){' '}
                            </Text>
                            <ReturnSection product={product} getOrderDetails />
                        </Flex>
                    </Space>
                    <Image
                        src={product.image}
                        alt="Product"
                        style={{ minWidth: 80, minHeight: 80 }}
                        width={80}
                        height={80}
                        className="object-contain "
                        fallback={defaultImage}
                    />
                </Flex>
            ))}
        </Flex>
    );
};

export default ProductsListingSm;
