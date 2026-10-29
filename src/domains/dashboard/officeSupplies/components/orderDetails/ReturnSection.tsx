import { useState, type FC } from 'react';

import { Flex, Typography } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import { OrderedProduct } from '../../types/orderHistory';
import ProductReturnModal from '../modals/ProductReturnModal';
import ToolTip from '../ToolTip';

interface ReturnSectionProps {
    product: OrderedProduct;
    getOrderDetails: any;
}

const ReturnSection: FC<ReturnSectionProps> = ({ product, getOrderDetails }) => {
    const orderDetails = useAppSelector(state => state.reducer.orderDetails.orderDetails);
    const orderId = orderDetails?.id!;
    const orderStatus = orderDetails?.ecomOrderStatus || 'PENDING';
    const isDelivered = ['COMPLETED', 'DELIVERED'].includes(orderStatus);

    const [productId, setProductId] = useState<number>();
    const [isProductReturnModalVisible, setProductReturnModalVisible] = useState(false);

    const handleProductReturn = (id: number) => {
        setProductId(id);
        setProductReturnModalVisible(true);
    };

    return (
        <>
            {isDelivered && !product?.status ? (
                <Typography.Text
                    onClick={() => handleProductReturn(product.productId)}
                    className="text-green-600 cursor-pointer"
                >
                    Request for Return
                </Typography.Text>
            ) : (
                <>
                    {isDelivered && product?.status === 'Return Requested' && (
                        <Typography.Text className="text-orange-500">
                            {product?.status} <ToolTip message={product?.reason} />{' '}
                        </Typography.Text>
                    )}
                    {isDelivered && product?.status === 'Return Initiated' && (
                        <Flex gap={5} vertical>
                            <Typography.Text className="text-yellow-500">
                                {product?.status} <ToolTip message={product?.reason} />
                            </Typography.Text>
                            <Typography.Text className="">
                                Your item return pickup date:{' '}
                                {product?.returnPickUpDate
                                    ? new Date(product?.returnPickUpDate).toLocaleDateString(
                                          'en-US',
                                          {
                                              weekday: 'short',
                                              year: 'numeric',
                                              month: 'short',
                                              day: '2-digit',
                                          }
                                      )
                                    : 'N/A'}
                            </Typography.Text>
                        </Flex>
                    )}
                    {isDelivered && product?.status === 'Return Completed' && (
                        <Flex gap={5} vertical>
                            <Typography.Text className="text-green-600">
                                {product?.status} <ToolTip message={product?.reason} />
                            </Typography.Text>
                            <Typography.Text>
                                Your item return completed date:{' '}
                                {product?.returnCompletedDate
                                    ? new Date(product?.returnCompletedDate).toLocaleDateString(
                                          'en-US',
                                          {
                                              weekday: 'short',
                                              year: 'numeric',
                                              month: 'short',
                                              day: '2-digit',
                                          }
                                      )
                                    : 'N/A'}
                            </Typography.Text>
                        </Flex>
                    )}
                    {isDelivered && product?.status === 'Return Rejected' && (
                        <Flex gap={5} vertical>
                            <Typography.Text className="text-red-600">
                                {product?.status} <ToolTip message={product?.reason} />
                            </Typography.Text>
                            <Typography.Text className="">
                                Your item return rejected date:{' '}
                                {product?.returnRejectedDate
                                    ? new Date(product?.returnRejectedDate).toLocaleDateString(
                                          'en-US',
                                          {
                                              weekday: 'short',
                                              year: 'numeric',
                                              month: 'short',
                                              day: '2-digit',
                                          }
                                      )
                                    : 'N/A'}
                            </Typography.Text>
                        </Flex>
                    )}
                </>
            )}
            <ProductReturnModal
                orderId={orderId}
                productId={productId!}
                visible={isProductReturnModalVisible}
                onCancel={() => setProductReturnModalVisible(false)}
                onSuccess={() => getOrderDetails()}
            />
        </>
    );
};

export default ReturnSection;
