import React, { useState } from 'react';

import { Steps, Typography, Flex, Image, Button } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';

import DeliveryAddress from './DeliveryAddress';
import Tracking from './Tracking';
import {
    NoteBookSVG,
    HandshakeSVG,
    PackageSVG,
    TruckSVG,
    NoteBookSuccessSVG,
    PackageSuccessSVG,
    TruckSuccessSVG,
    HandshakeSuccessSVG,
    TickSuccessSVG,
    TickSVG,
} from '../../assets/icons/order-status';
import { useManageOrderApi } from '../../hooks/useManageOrderApi';
import OrderCancellationModal from '../modals/OrderCancellationModal';

const { Step } = Steps;

const stepIcons = [NoteBookSVG, PackageSVG, TickSVG, TruckSVG, HandshakeSVG];
const stepIconSuccess = [
    NoteBookSuccessSVG,
    PackageSuccessSVG,
    TickSuccessSVG,
    TruckSuccessSVG,
    HandshakeSuccessSVG,
];
const stepTitles = ['Order Pending', 'Order Placed', 'In Progress', 'Shipped', 'Delivered'];
const status = {
    PENDING: 0,
    CONFIRMED: 1,
    INPROGRESS: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    COMPLETED: 4,
};

const ShipmentDetails: React.FC = () => {
    const screens = useScreenSize();
    const orderDetails = useAppSelector(state => state.reducer.orderDetails.orderDetails);
    const orderStatus = orderDetails?.ecomOrderStatus ?? 'PENDING';
    const currentStep = status[orderStatus as keyof typeof status];
    const isCancelled = orderStatus === 'CANCELLED';
    const orderId = orderDetails?.id!;
    const [IsCancelRequested, setIsCancelRequested] = useState<boolean>(
        orderDetails?.workspaceOrderStatus === 'Cancel Requested'
    );
    const isCancelRejected = orderDetails?.workspaceOrderStatus === 'Cancel rejected';
    const isDelivered = ['COMPLETED', 'DELIVERED'].includes(orderStatus);

    const [isCancellationModalVisible, setCancellationModalVisible] = React.useState(false);
    const { isLoading, cancelOrder } = useManageOrderApi();
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
    return (
        <>
            {!isCancelled && (
                <Flex vertical>
                    <Typography.Paragraph className="text-xl font-medium my-4 ">
                        Shipment Details
                    </Typography.Paragraph>
                    <Steps
                        className="mt-6 sm:mt-14 sm:mb-32"
                        current={currentStep}
                        progressDot
                        size="default"
                        labelPlacement="vertical"
                    >
                        {stepTitles.map((title, index) => (
                            <Step
                                status={currentStep < index ? 'wait' : 'finish'}
                                key={index}
                                title={
                                    <Flex>
                                        {currentStep < index ? (
                                            <Image
                                                preview={false}
                                                src={stepIcons[index]}
                                                alt="icon"
                                            />
                                        ) : (
                                            <Image
                                                preview={false}
                                                src={stepIconSuccess[index]}
                                                alt="icon"
                                            />
                                        )}
                                    </Flex>
                                }
                                description={
                                    <Typography.Text className="mt-4 text-xs font-medium">
                                        {title}
                                    </Typography.Text>
                                }
                            />
                        ))}
                    </Steps>
                    <DeliveryAddress />
                    <Tracking />
                    <Flex flex={1} justify="start" className="w-full py-5">
                        {screens.xs && !isDelivered && !isCancelled && (
                            <>
                                {IsCancelRequested || isCancelRejected ? (
                                    <Typography.Text className="text-red-500 text-[1rem] font-normal">
                                        {isCancelRejected
                                            ? 'Your request for cancellation has been rejected'
                                            : 'You have requested for cancellation'}
                                    </Typography.Text>
                                ) : (
                                    <Button onClick={() => setCancellationModalVisible(true)}>
                                        Request for Order Cancellation
                                    </Button>
                                )}
                            </>
                        )}
                    </Flex>
                    {screens.xs && isCancellationModalVisible && (
                        <OrderCancellationModal
                            isLoading={isLoading}
                            visible={isCancellationModalVisible}
                            onCancel={() => setCancellationModalVisible(false)}
                            onSubmit={handleCancellationSubmit}
                        />
                    )}
                </Flex>
            )}
        </>
    );
};
export default ShipmentDetails;
