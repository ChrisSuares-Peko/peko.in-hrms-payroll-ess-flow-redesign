import { memo, useMemo } from 'react';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';
import { capitalize } from 'lodash';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import OrdersTable from './billing_saved_cards/OrdersTable';
import TextCard from './billing_saved_cards/TextCard';
import useActiveSubscription from '../hooks/subscriptions/useActiveSubscription';

const BillingAndSavedCards = () => {
    const { isLoading, data } = useActiveSubscription();
    const planDetails = useMemo(() => {
        if (!data) return null;

        const planName = data.package.packageName || '-';
        const isFreePlan = !Number(data.subscriptionAmountPaid) || !data.billingType;
        const billingCycle = isFreePlan ? '-' : capitalize(data.billingType);
        const status = capitalize(data.status || 'Inactive');
        const amount = isFreePlan
            ? '-'
            : `₹ ${formatNumberWithLocalString(data.subscriptionAmountPaid)}`;
        const paymentMode = isFreePlan ? '-' : data.paymentMode || '-';

        return { planName, billingCycle, status, amount, paymentMode };
    }, [data]);

    return (
        <Flex vertical className="gap-5 rounded-md sm:mt-4">
            <Row className="gap-5">
                {data && (
                    <Col
                        xs={24}
                        lg={14}
                        className="flex flex-col justify-between gap-4 py-5 border border-gray-200 border-solid px-7 rounded-2xl"
                    >
                        <Flex vertical>
                            <Flex justify="space-between">
                                <Typography.Text className="text-base font-medium">
                                    Current Plan Summary
                                </Typography.Text>
                                {/* {!data.isTopMostPlan && (
                                    <Link to={`/${paths.plans.index}`}>
                                        <Button danger className="text-xs font-medium">
                                            Upgrade Plan
                                        </Button>
                                    </Link>
                                )} */}
                            </Flex>
                            {isLoading ? (
                                <Skeleton />
                            ) : (
                                <Flex wrap="wrap" className="gap-10 mt-4" justify="space-between">
                                    <TextCard label="Plan Name" value={planDetails?.planName} />
                                    <TextCard
                                        label="Billing Cycle"
                                        value={planDetails?.billingCycle}
                                    />
                                    <TextCard label="Status" value={planDetails?.status} />
                                    <TextCard
                                        label="Payment Mode"
                                        value={planDetails?.paymentMode}
                                    />
                                    <TextCard label="Amount" value={planDetails?.amount} />
                                </Flex>
                            )}
                        </Flex>
                    </Col>
                )}
            </Row>
            <OrdersTable />
        </Flex>
    );
};

export default memo(BillingAndSavedCards);
