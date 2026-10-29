import React from 'react';

import { Flex, Row, Typography } from 'antd';
import { capitalize } from 'lodash';

import { SubscriptionHistory } from '@customtypes/general';
import { formattedDateWithDefault } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import TextCard from './TextCard';

interface PlanDetailsProps {
    purchaseData: SubscriptionHistory & { isCustom?: number; isCancelled?: number | boolean };
    isGroupSubscription?: boolean;
    rightSlot?: React.ReactNode;
}
const PlanDetails = ({
    purchaseData,
    isGroupSubscription = false,
    rightSlot,
}: PlanDetailsProps) => {
    const {
        billingType,
        subscriptionAmountPaid,
        maxLimit,
        status,
        subscriptionStartDate,
        subscriptionEndDate,
    } = purchaseData;
    const isCancelledBucket = !!purchaseData.isCancelled;
    // Peko Free has no billing cycle — hide Cycle / Plan Started / Valid Until (they're not meaningful).
    // Paid plans (incl. net-0 upgrades) keep a billingType, and add-on rows are isCustom, so both still show.
    const isFreePlan = !purchaseData.isCustom && !billingType;

    let title: string;
    if (purchaseData.isCustom) {
        title = `${purchaseData.package.packageName} - Add on`;
    } else if (isGroupSubscription) {
        title = `Payroll (${purchaseData.package.packageName})`;
    } else {
        title = `${purchaseData.package.packageName} - ${capitalize(billingType) || 'Monthly'}`;
    }

    const statusValue = isCancelledBucket ? 'Cancelled' : capitalize(status);
    const statusColor = isCancelledBucket ? '#DC2626' : '#05BE63';
    const cycleColor = isCancelledBucket ? '#9CA3AF' : '#05BE63';

    return (
        <Flex
            className="flex-col h-full p-8 px-10 mt-5 border border-gray-200 border-solid w-full max-w-7xl md:flex-row rounded-2xl xs:bg-bgLightGray md:bg-white"
            justify="space-between"
            align="center"
            gap={20}
        >
            <Flex className="flex flex-1">
                <Row gutter={[10, 20]} className="w-full">
                    <Row>
                        <Typography.Text className="text-xl font-medium">{title}</Typography.Text>
                    </Row>
                    <Row className="w-full">
                        <Flex
                            wrap="wrap"
                            justify="start"
                            className="w-full gap-x-10 xl:gap-x-24 gap-y-4"
                        >
                            <TextCard
                                label="Total Amount"
                                value={`₹ ${formatNumberWithLocalString(subscriptionAmountPaid)}`}
                            />
                            <TextCard label="Total Employees" value={`${maxLimit} employees`} />
                            <TextCard
                                label="Status"
                                value={statusValue}
                                valueColor={statusColor}
                                valueTooltip={
                                    isCancelledBucket
                                        ? 'This add-on is already cancelled. Access continues until the end of the current cycle.'
                                        : undefined
                                }
                            />
                            {!isFreePlan && (
                                <>
                                    <TextCard
                                        label="Cycle"
                                        value={capitalize(billingType) || 'Monthly'}
                                        valueColor={cycleColor}
                                    />
                                    <TextCard
                                        label="Plan Started"
                                        value={formattedDateWithDefault(
                                            new Date(subscriptionStartDate)
                                        )}
                                    />
                                    <TextCard
                                        label={isCancelledBucket ? 'Access Until' : 'Valid Until'}
                                        value={formattedDateWithDefault(
                                            new Date(subscriptionEndDate)
                                        )}
                                    />
                                </>
                            )}
                        </Flex>
                    </Row>
                </Row>
            </Flex>
            {rightSlot && <Flex className="flex-shrink-0">{rightSlot}</Flex>}
        </Flex>
    );
};

export default PlanDetails;
