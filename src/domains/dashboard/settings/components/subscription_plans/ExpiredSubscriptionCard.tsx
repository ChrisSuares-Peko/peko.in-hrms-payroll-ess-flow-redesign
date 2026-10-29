import React from 'react';

import { WarningOutlined } from '@ant-design/icons';
import { Button, Flex, Row, Typography } from 'antd';
import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';
import { formattedDateWithDefault } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { ActiveSubscription } from '../../types/subscription';
import { packageRoutes } from '../../utils';
import TextCard from '../billing_saved_cards/TextCard';

const { Text } = Typography;

interface Props {
    plan: ActiveSubscription;
    onCancel?: (plan: ActiveSubscription) => void;
}

const ExpiredSubscriptionCard = ({ plan, onCancel }: Props) => {
    const navigate = useNavigate();

    const handleRenew = () => {
        const baseUrl = window.location.origin;
        const packageName = plan.package.packageName as keyof typeof packageRoutes;
        const routePath = packageRoutes[packageName] ?? paths.dashboard.home;

        const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
        const normalizedPath = routePath.replace(/^\/+/, '');
        const currentPageUrl = `${normalizedBaseUrl}/${normalizedPath}`.replace(
            /([^:]\/)\/+/g,
            '$1'
        );

        sessionStorage.setItem(
            'PlanDetails',
            JSON.stringify({
                url: `${currentPageUrl}`,
                service: plan.package.packageName,
                planId: plan.package.id,
                selectedType: plan.billingType ? plan.billingType.toLowerCase() : 'monthly',
                isAddOns: false,
            })
        );
        navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`, {
            state: { isSettingsPage: true },
        });
    };

    return (
        <Flex
            vertical
            className="w-full h-full border border-red-200 border-solid rounded-2xl xs:bg-bgLightGray md:bg-white overflow-hidden mt-4"
        >
            <Flex
                className="w-full bg-red-50 p-4 border-b border-red-200 border-solid"
                align="center"
                gap={10}
            >
                <WarningOutlined className="text-red-500 text-lg" />
                <Text className="text-red-600 font-medium">
                    This subscription has expired. Please renew to continue using this service.
                </Text>
            </Flex>

            <Flex
                className="flex-col w-full h-full p-8 px-10 md:flex-row mb-3"
                justify="space-between"
                align="center"
                gap={60}
            >
                <Flex className="flex flex-1 ">
                    <Row gutter={[10, 20]} className="w-full">
                        <Row className='mt-3'>
                            <Text className="text-xl font-medium">
                                {plan.isCustom
                                    ? `${plan.package.packageName} - Add on `
                                    : plan.package.packageName}{' '}
                            </Text>
                        </Row>
                        <Row className="w-full mt-2">
                            <Flex
                                justify="start"
                                className="flex-wrap w-full gap-10 xl:gap-20 xxl:gap-24 xxl:flex-nowrap"
                            >
                                <TextCard label="Total Amount" value={`₹ ${formatNumberWithLocalString(plan.subscriptionAmountPaid)}`} />
                                <Flex vertical gap={10}>
                                    <Text className="text-gray-400">Status</Text>
                                    <Flex
                                        className="bg-red-50 border border-red-200 border-solid rounded-full px-3 py-1 items-center justify-center"
                                        style={{ height: 'fit-content' }}
                                    >
                                        <Text className="text-red-500 font-medium text-xs">
                                            • Expired
                                        </Text>
                                    </Flex>
                                </Flex>
                                <Flex className="xxl:w-28 ">
                                    <TextCard label="Plan Started" value={formattedDateWithDefault(new Date(plan.subscriptionStartDate))} />
                                </Flex>

                                <Flex className="xxl:w-28">
                                    <TextCard label="Valid Until" value={formattedDateWithDefault(new Date(plan.subscriptionEndDate))} />
                                </Flex>
                                <TextCard label="Billed" value={capitalize(plan.billingType)} />
                                <TextCard label="Payment Mode" value="Auto" />
                            </Flex>
                        </Row>
                    </Row>
                </Flex>
                <Flex justify="end" vertical gap={20} align="center" className="min-w-40 mt-1 md:mt-10">
                    <Button
                        type="primary"
                        danger
                        className="font-medium bg-red-500 w-full"
                        onClick={handleRenew}
                    >
                        Renew Subscription
                    </Button>

                </Flex>
            </Flex>
        </Flex>
    );
};

export default ExpiredSubscriptionCard;
