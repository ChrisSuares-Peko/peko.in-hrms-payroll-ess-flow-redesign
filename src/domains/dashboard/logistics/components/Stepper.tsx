/* eslint-disable no-nested-ternary */
import React, { useState, useMemo } from 'react';

import { Flex, Image, Steps, Typography } from 'antd';

import {
    HandshakeSVG,
    PackageSVG,
    TruckSVG,
    PackageSuccessSVG,
    TruckSuccessSVG,
    HandshakeSuccessSVG,
    TickSuccessSVG,
    TickSVG,
    CancelledIcon,
} from '../assets/icons/order-status';
import { TrackingStatus } from '../types/tracking';

const { Step } = Steps;

interface StepperProps {
    statuses: TrackingStatus[];
}

const Stepper: React.FC<StepperProps> = ({ statuses }) => {
    const [current, setCurrent] = useState<number>(1);

    const stepTitles = useMemo(() => {
        let titles = [
            { label: 'Order Placed', icon: PackageSVG, successIcon: PackageSuccessSVG },
            { label: 'In Progress', key: 'PENDING', icon: TickSVG, successIcon: TickSuccessSVG },
            { label: 'Shipped', key: 'PICKUP', icon: TruckSVG, successIcon: TruckSuccessSVG },
            {
                label: 'Delivered',
                key: 'DELIVERED',
                icon: HandshakeSVG,
                successIcon: HandshakeSuccessSVG,
            },
        ];

        const isCancelled = statuses.some(status => status.orderStatus === 'CANCELLED');
        if (isCancelled) {
            titles = titles.slice(0, 2);
            titles.push({
                label: 'Cancelled',
                key: 'CANCELLED',
                icon: CancelledIcon,
                successIcon: CancelledIcon,
            });
            setCurrent(2);
        } else {
            const latestStatus = statuses[statuses.length - 1];
            const index = titles.findIndex(step => step.key === latestStatus.orderStatus);
            if (index !== -1) setCurrent(index);
        }

        return titles;
    }, [statuses]);

    return (
        <Flex className="block my-8">
            <Flex className="hidden md:block">
                <Steps
                    className="mt-6 sm:mt-14"
                    current={current}
                    progressDot
                    size="default"
                    labelPlacement="vertical"
                >
                    {stepTitles.map((step, index) => (
                        <Step
                            status={
                                step.key === 'CANCELLED'
                                    ? 'error'
                                    : current < index
                                      ? 'wait'
                                      : 'finish'
                            }
                            key={index}
                            title={
                                <Flex>
                                    {current < index ? (
                                        <Image preview={false} src={step.icon} alt="icon" />
                                    ) : (
                                        <Image preview={false} src={step.successIcon} alt="icon" />
                                    )}
                                </Flex>
                            }
                            description={
                                <Typography.Text className="mt-4 text-xs font-medium">
                                    {step.label}
                                </Typography.Text>
                            }
                        />
                    ))}
                </Steps>
            </Flex>
            <Flex className="block md:hidden">
                <Steps initial={1} direction="vertical" current={current} items={stepTitles} />
            </Flex>
        </Flex>
    );
};

export default Stepper;
