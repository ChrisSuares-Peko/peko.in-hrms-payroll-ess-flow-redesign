import React from 'react';

import { Flex, Row, Typography } from 'antd';
import { capitalize } from 'lodash';

import { SubscriptionHistory } from '@customtypes/general';
import { formattedDateOnly } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import TextCard from './TextCard';

interface PlanDetailsProps {
    purchaseData: SubscriptionHistory & { isCustom?: number };
    isGroupSubscription?: boolean;
}
const PlanDetails = ({ purchaseData, isGroupSubscription = false }: PlanDetailsProps) => {
    const {
        billingType,
        subscriptionAmountPaid,
        maxLimit,
        status,
        subscriptionStartDate,
        subscriptionEndDate,
    } = purchaseData;
    // Peko Free has no billing cycle — hide Cycle / Plan Started / Valid Until (they're not meaningful).
    // Paid plans (incl. net-0 upgrades) keep a billingType, and add-on rows are isCustom, so both still show.
    const isFreePlan = !purchaseData.isCustom && !billingType;
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
                            {
                                // eslint-disable-next-line no-nested-ternary
                                purchaseData.isCustom
                                    ? `${purchaseData.package.packageName} - Add on`
                                    : isGroupSubscription
                                      ? `eSign (${purchaseData.package.packageName})`
                                      : `${purchaseData.package.packageName} - ${capitalize(billingType) || 'Monthly'}`
                            }{' '}
                        </Typography.Text>
                    </Row>
                    <Row className="w-full" gutter={[0, 10]}>
                        <TextCard
                            label="Total Amount (incl. GST)"
                            value={`₹ ${formatNumberWithLocalString(subscriptionAmountPaid)}`}
                        />
                        <TextCard label="Total eSign" value={`${maxLimit}`} />
                        <TextCard label="Status" value={capitalize(status)} valueColor="#05BE63" />
                        {!isFreePlan && (
                            <>
                                <TextCard
                                    label="Cycle"
                                    value={
                                        purchaseData.isCustom
                                            ? 'One-time'
                                            : capitalize(billingType) || 'Monthly'
                                    }
                                    valueColor="#05BE63"
                                />
                                <TextCard
                                    label="Plan Started"
                                    value={formattedDateOnly(new Date(subscriptionStartDate))}
                                />
                                <TextCard
                                    label="Valid Until"
                                    value={
                                        subscriptionEndDate
                                            ? formattedDateOnly(new Date(subscriptionEndDate))
                                            : 'N/A'
                                    }
                                />
                            </>
                        )}
                    </Row>
                </Row>
            </Flex>
        </Flex>
    );
};

export default PlanDetails;
