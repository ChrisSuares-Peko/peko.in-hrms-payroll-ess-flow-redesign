// components/OrderProductDetails.tsx
import React, { useState } from 'react';

import { Typography, Row, Col, Flex, Button, Space, Divider } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CancelledSection from './CancelledSection';
import ProductListingLG from './ProductListingLG';
import ProductsListingSm from './ProductsListingSm';
import { useManageOrderApi } from '../../hooks/useManageOrderApi';
import OrderCancellationModal from '../modals/OrderCancellationModal';

const { Text } = Typography;
type Props = { getOrderDetails?: any };
const OrderProductDetails = ({ getOrderDetails }: Props) => {
    const screens = useScreenSize();
    const { isLoading, cancelOrder, generateInvoice } = useManageOrderApi();
    const orderDetails = useAppSelector(state => state.reducer.orderDetails.orderDetails);
    const orderId = orderDetails?.id!;
    const transactionId = Number(orderDetails?.corporateTxnId);
    const orderStatus = orderDetails?.ecomOrderStatus || 'PENDING';
    const [IsCancelRequested, setIsCancelRequested] = useState<boolean>(
        orderDetails?.workspaceOrderStatus === 'Cancel Requested'
    );
    const isCancelled = orderStatus === 'CANCELLED';
    const isCancelRejected = orderDetails?.workspaceOrderStatus === 'Cancel rejected';
    const isDelivered = ['COMPLETED', 'DELIVERED'].includes(orderStatus);
    const [loadingType, setLoadingType] = useState<string | null>(null);
    const shippingFee = formatNumberWithLocalString(orderDetails?.shippingFee || 0);
    const convenienceFee = formatNumberWithLocalString(orderDetails?.surcharge || 0);

    const [isCancellationModalVisible, setCancellationModalVisible] = React.useState(false);
    const handleCancellationSubmit = async (values: {
        reason: string;
        description: string;
        otp: string;
        scope: string;
    }) => {
        const result = await cancelOrder(
            orderId!,
            values.description,
            values.reason,
            values.otp,
            values.scope
        );
        if (result) {
            setCancellationModalVisible(false);
            setIsCancelRequested(!IsCancelRequested);
            return true;
        }
        // setIsCancelRequested(!IsCancelRequested);
        return false;
    };

    const handleDownloadInvoiceOrReceipt = (txnId: number, type: string) => {
        setLoadingType(type);
        generateInvoice(txnId, type);
    };

    return (
        <Flex vertical>
            {isCancelled && <CancelledSection />}

            <Row>
                <Col span={24}>
                    <Typography.Paragraph className="text-xl font-medium">
                        Order Details
                    </Typography.Paragraph>

                    {screens.md ? (
                        <ProductListingLG getOrderDetails={getOrderDetails} />
                    ) : (
                        <ProductsListingSm getOrderDetails={getOrderDetails} />
                    )}

                    <Flex
                        className={`my-5 ${!screens.md && 'flex-col-reverse '}`}
                        gap={20}
                        align="baseline"
                    >
                        <Flex gap={11} flex={1} vertical className="w-full mb-5">
                            <Flex gap={11} justify="space-between">
                                <Space>
                                    <Typography.Text className="font-medium text-gray-900 ">
                                        Shipping charges:
                                    </Typography.Text>
                                </Space>
                                <Space>
                                    <Typography.Text className="font-medium text-gray-900 font-roboto">
                                        AED {formatNumberWithLocalString(shippingFee)}
                                    </Typography.Text>
                                </Space>
                            </Flex>
                            <Flex gap={11} justify="space-between">
                                <Space>
                                    <Typography.Text className="font-medium text-gray-900 ">
                                        Platform fee (inclusive of VAT):
                                    </Typography.Text>
                                </Space>
                                <Space>
                                    <Typography.Text className="font-medium text-gray-900 font-roboto">
                                        AED {formatNumberWithLocalString(convenienceFee)}
                                    </Typography.Text>
                                </Space>
                            </Flex>
                            <Divider style={{ margin: '8px 0' }} />
                            <Flex justify="space-between">
                                <Space>
                                    <Typography.Text className="font-medium text-gray-900 ">
                                        Total
                                    </Typography.Text>
                                </Space>
                                <Space>
                                    <Typography.Text
                                        strong
                                        className="font-medium text-gray-900 font-roboto"
                                    >
                                        AED {formatNumberWithLocalString(orderDetails?.amountInAed)}
                                    </Typography.Text>
                                </Space>
                            </Flex>
                        </Flex>
                        <Flex flex={1} justify="end" className="w-full">
                            {!screens.xs && !isDelivered && !isCancelled && (
                                <>
                                    {IsCancelRequested || isCancelRejected ? (
                                        <Text className="text-red-500 text-[1rem] font-normal">
                                            {isCancelRejected
                                                ? 'Your request for cancellation has been rejected'
                                                : 'You have requested for cancellation'}
                                        </Text>
                                    ) : (
                                        <Button onClick={() => setCancellationModalVisible(true)}>
                                            Request for Order Cancellation
                                        </Button>
                                    )}
                                </>
                            )}
                            {isDelivered && transactionId && (
                                <Flex
                                    gap={10}
                                    className="flex flex-col sm:flex-row w-full"
                                    justify="end"
                                >
                                    {orderDetails?.isInvoice && (
                                        <Button
                                            loading={isLoading && loadingType === 'invoice'}
                                            onClick={() =>
                                                handleDownloadInvoiceOrReceipt(
                                                    transactionId,
                                                    'invoice'
                                                )
                                            }
                                            className="rounded-lg"
                                        >
                                            Download Invoice
                                        </Button>
                                    )}
                                    <Button
                                        loading={isLoading && loadingType === 'receipt'}
                                        onClick={() =>
                                            handleDownloadInvoiceOrReceipt(transactionId, 'receipt')
                                        }
                                        className="rounded-lg"
                                    >
                                        Download Receipt
                                    </Button>
                                </Flex>
                            )}
                        </Flex>
                    </Flex>
                </Col>

                <OrderCancellationModal
                    isLoading={isLoading}
                    visible={isCancellationModalVisible}
                    onCancel={() => setCancellationModalVisible(false)}
                    onSubmit={handleCancellationSubmit}
                />
            </Row>
        </Flex>
    );
};

export default OrderProductDetails;
