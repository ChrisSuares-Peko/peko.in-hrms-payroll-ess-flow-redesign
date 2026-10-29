import React from 'react';

import { Steps, Typography, Flex, Image } from 'antd';

import { useAppSelector } from '@src/hooks/store';

import {
    NoteBookSVG,
    HandshakeSVG,
    NoteBookSuccessSVG,
    HandshakeSuccessSVG,
    TickSuccessSVG,
    TickSVG,
} from '../../assets/icons/order-status';

const { Step } = Steps;

const stepIcons = [NoteBookSVG, TickSVG, HandshakeSVG];
const stepIconSuccess = [NoteBookSuccessSVG, TickSuccessSVG, HandshakeSuccessSVG];
const stepTitles = ['Work Assigned', 'Work on progress', 'Delivered'];
const status = {
    PENDING: 0,
    ONPROGRESS: 1,
    COMPLETED: 2,
};

const ShipmentDetails: React.FC = () => {
    const orderDetails = useAppSelector(state => state.reducer.works.orderDetails);
    const orderStatus = orderDetails?.status ?? 'PENDING';
    const currentStep = status[orderStatus as keyof typeof status];
    return (
        <Flex vertical className="mt-8">
            <Typography.Title level={5}>Work Status</Typography.Title>
            <Steps
                className="mt-6 sm:mt-14 mb-32"
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
                                    <Image preview={false} src={stepIcons[index]} alt="icon" />
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
        </Flex>
    );
};
export default ShipmentDetails;
