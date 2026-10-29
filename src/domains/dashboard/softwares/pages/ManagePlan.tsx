import React from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Row, Skeleton, Typography } from 'antd';
import { capitalize } from 'lodash';

import useManagePlan from '../hooks/order/useManagePlan';

type Props = {
    label?: string;
    value?: string;
    valueClassName?: string;
};

const TextCard = ({ label, value, valueClassName }: Props) => (
    <Flex vertical gap={15}>
        {label && <Typography.Text className="text-gray-400 text-nowrap">{label}</Typography.Text>}
        <Typography.Text className={`${valueClassName ?? ''} text-sm`}>{value}</Typography.Text>
    </Flex>
);

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ManagePlan = () => {
    const { order, handleCancelPlan, isLoading, isFetching } = useManagePlan();

    if (isFetching) {
        return <Skeleton />;
    }

    if (!isFetching && !order) return <Empty />;

    const isSubscription = order?.purchaseType === 'subscription' || order?.purchaseType === null;
    const totalAmount = `₹ ${Number(order?.order?.amountInINR).toFixed?.(2) ?? '0.00'}`;

    return (
        <Flex
            className="flex-col w-full h-full p-8 border border-gray-200 border-solid md:flex-row rounded-2xl xs:bg-bgLightGray md:bg-white"
            justify="space-between"
            align="center"
        >
            <Flex className="flex flex-1">
                <Row gutter={[10, 20]} className="w-full">
                    <Row>
                        <Typography.Text className="text-2xl font-medium">
                            {capitalize(order?.productName)}
                        </Typography.Text>
                    </Row>
                    <Row justify="start" className="w-full gap-16 xl:gap-20" gutter={[0, 30]}>
                        <TextCard label="Total Amount" value={totalAmount} />
                        {isSubscription ? (
                            <>
                                <TextCard
                                    label="Status"
                                    value={capitalize(order?.status)}
                                    valueClassName="text-[#12B76A]  bg-[#ECFDF3] rounded-full text-center py-1 px-3 ms-[-.5rem]"
                                />
                                <TextCard
                                    label="Plan Started"
                                    value={formatDate(order?.subscriptionStartDate)}
                                />
                                <TextCard
                                    label="Valid Until"
                                    value={formatDate(order?.subscriptionEndDate)}
                                />
                                <TextCard label="Billed" value={capitalize(order?.billingCycle)} />
                                <TextCard
                                    label="Payment Mode"
                                    value={capitalize(order?.order?.paymentMode)}
                                />
                                {order?.isCancelled ? (
                                    <Typography.Text className="mt-3 text-red-700">
                                        Cancellation effective on{' '}
                                        {formatDate(order?.subscriptionEndDate)}
                                    </Typography.Text>
                                ) : (
                                    <Button
                                        danger
                                        icon={<CloseCircleOutlined />}
                                        loading={isLoading}
                                        onClick={!isLoading ? handleCancelPlan : undefined}
                                        disabled={
                                            isLoading ||
                                            order.isCancelled ||
                                            order.status !== 'ACTIVE'
                                        }
                                        className="mt-3"
                                    >
                                        {isLoading ? 'Cancelling' : 'Cancel my plan'}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                <TextCard
                                    label="Purchase Type"
                                    value="One time"
                                    valueClassName="text-[#12B76A]  bg-[#ECFDF3] rounded-full text-center p-1"
                                />
                                <TextCard
                                    label="Plan Started"
                                    value={formatDate(order?.subscriptionStartDate)}
                                />
                                <TextCard
                                    label="Payment Mode"
                                    value={capitalize(order?.order?.paymentMode || '')}
                                />
                            </>
                        )}
                    </Row>
                </Row>
            </Flex>
        </Flex>
    );
};

export default ManagePlan;
