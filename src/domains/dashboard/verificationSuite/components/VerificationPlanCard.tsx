import React from 'react';

import { Flex, Row, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { capitalize } from 'lodash';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import VerificationTextCard from './VerificationTextCard';
import useVerificationPlan from '../hooks/useVerificationPlan';

const VerificationPlanCard = () => {
    const { plan, loading } = useVerificationPlan();

    if (loading) {
        return <Skeleton className="mt-5" />;
    }

    if (!plan) {
        return null;
    }

    return (
        <Flex
            className="flex-col h-full p-8 px-5 sm:px-10 mt-5 border border-gray-200 border-solid w-full md:flex-row rounded-2xl xs:bg-bgLightGray md:bg-white"
            justify="space-between"
            align="center"
        >
            <Flex className="flex flex-1">
                <Row gutter={[10, 20]} className="w-full">
                    <Row>
                        <Typography.Text className="text-xl font-medium">
                            {plan.package?.packageName} - {capitalize(plan.billingType)}
                        </Typography.Text>
                    </Row>
                    <Row className="w-full" gutter={[0, 10]}>
                        <VerificationTextCard
                            label="Total Amount"
                            value={`₹ ${formatNumberWithLocalString(plan.subscriptionAmountPaid)}`}
                        />
                        <VerificationTextCard
                            label="Status"
                            value={capitalize(plan.status)}
                            valueColor="#05BE63"
                        />
                        <VerificationTextCard
                            label="Cycle"
                            value={capitalize(plan.billingType)}
                            valueColor="#05BE63"
                        />
                        <VerificationTextCard
                            label="Plan Started"
                            value={dayjs(plan.subscriptionStartDate).format('DD/MM/YYYY')}
                        />
                        <VerificationTextCard
                            label="Valid Until"
                            value={dayjs(plan.subscriptionEndDate).format('DD/MM/YYYY')}
                        />
                    </Row>
                </Row>
            </Flex>
        </Flex>
    );
};

export default VerificationPlanCard;
