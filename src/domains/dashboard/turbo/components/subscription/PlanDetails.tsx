import React from 'react';

import { CloseCircleOutlined } from '@ant-design/icons';
import { Flex, Row, Typography } from 'antd';
import { capitalize } from 'lodash';

import { SubscriptionHistory } from '@customtypes/general';
import { formattedDateWithDefault } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import TextCard from './TextCard';

interface PlanDetailsProps {
    purchaseData: SubscriptionHistory & { isCustom?: number };
    isGroupSubscription?: boolean;
    count?: number;
    onCancelPlan?: () => void;
    isLoading?: boolean;
}
const PlanDetails = ({
    purchaseData,
    isGroupSubscription = false,
    count,
    onCancelPlan,
    isLoading,
}: PlanDetailsProps) => {
    const {
        billingType,
        subscriptionAmountPaid,
        status,
        subscriptionStartDate,
        subscriptionEndDate,
        isCancelled,
    } = purchaseData;
    // Peko Free has no billing cycle — hide Cycle / Plan Started / Valid Until (they're not meaningful).
    // Paid plans (incl. net-0 upgrades) keep a billingType, and add-on rows are isCustom, so both still show.
    const isFreePlan = !purchaseData.isCustom && !billingType;
    return (
        <Flex
            className="flex-col w-full h-full p-8 px-5 mt-5 border border-gray-200 border-solid sm:px-10 md:flex-row rounded-2xl xs:bg-bgLightGray md:bg-white !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
            justify="space-between"
            align={onCancelPlan ? 'center' : 'start'}
            gap={onCancelPlan ? 30 : 0}
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
                                      ? `Turbo (${purchaseData.package.packageName})`
                                      : `${purchaseData.package.packageName} - ${capitalize(billingType) || 'Monthly'}`
                            }{' '}
                        </Typography.Text>
                    </Row>
                    <Row className="w-full" gutter={[0, 10]}>
                        <TextCard
                            label="Total Amount (incl. GST)"
                            value={`₹ ${formatNumberWithLocalString(subscriptionAmountPaid)}`}
                        />

                        <TextCard label="Total Number of Vehicles & Drivers" value={`${count}`} />
                        <TextCard
                            label="Status"
                            value={capitalize(status)}
                            valueColor="#05BE63"
                            classNames="pl-3"
                        />
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
                                    value={formattedDateWithDefault(
                                        new Date(subscriptionStartDate)
                                    )}
                                />
                                <TextCard
                                    label="Valid Until"
                                    value={
                                        subscriptionEndDate
                                            ? formattedDateWithDefault(
                                                  new Date(subscriptionEndDate)
                                              )
                                            : 'N/A'
                                    }
                                />
                            </>
                        )}
                    </Row>
                </Row>
            </Flex>
            {onCancelPlan && (
                <Flex
                    justify="end"
                    vertical
                    gap={20}
                    align="center"
                    className="w-full mt-2 md:mt-0 md:w-auto md:min-w-40"
                >
                    {isCancelled ? (
                        <Typography.Text className="text-center text-red-700 cursor-default">
                            Cancellation effective on{' '}
                            {formattedDateWithDefault(new Date(subscriptionEndDate))}
                        </Typography.Text>
                    ) : (
                        <Typography.Text
                            onClick={onCancelPlan}
                            className="text-center text-[#FF4F4F] cursor-pointer"
                        >
                            <CloseCircleOutlined className="pe-2" />
                            Cancel Plan
                        </Typography.Text>
                    )}
                </Flex>
            )}
        </Flex>
    );
};

export default PlanDetails;
