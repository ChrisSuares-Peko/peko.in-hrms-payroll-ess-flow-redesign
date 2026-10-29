import React from 'react';

import { Col, Flex, Row, Skeleton, Typography } from 'antd';

import useGetPackageTableDetails from '@src/domains/dashboard/plans/hooks/useGetPackageTableDetails';

import ServicePlanRow from './ServicePlanRow';
import { subscriptionCompareTableData } from '../utils/subscriptionPlansData';

type Props = {};

const PlansCompareTable = (props: Props) => {
    const { individualPackages, groupPackages, isLoading, groupPackageDiscounts } =
        useGetPackageTableDetails();
    if (isLoading) {
        return (
            <Row>
                <Col span={24}>
                    <Skeleton
                        paragraph={{ rows: 10 }}
                        className="py-5"
                        round
                        loading
                        title={false}
                        active
                    />
                </Col>
            </Row>
        );
    }
    const saveAmountStandard =
        (groupPackageDiscounts?.Standard ?? 0) - (groupPackages?.Standard ?? 0);
    const saveAmountPremium = (groupPackageDiscounts?.Premium ?? 0) - (groupPackages?.Premium ?? 0);

    return (
        <Row className="hidden sm:block">
            <Col span={24} className="flex flex-col gap-10">
                <Row className="shadow-sm" align="middle" gutter={30}>
                    <Col span={6}>
                        <Typography.Text className="text-lg font-medium">Services</Typography.Text>
                    </Col>
                    <Col span={6}>
                        <Typography.Text className="text-lg font-medium">
                            Individual Plans
                        </Typography.Text>
                    </Col>

                    <Col span={6}>
                        <Flex vertical>
                            <Typography.Text className="text-base font-medium text-lightRed">
                                Standard
                            </Typography.Text>
                            <Typography.Text className="text-lg font-semibold">
                                ₹ {groupPackages?.Standard}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-normal">
                                per month
                            </Typography.Text>
                            {saveAmountStandard && saveAmountStandard > 0 && (
                                <Typography.Text className="py-1 text-xs font-normal text-textGreen">
                                    You will save ₹ {saveAmountStandard}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Col>
                    <Col span={6}>
                        <Flex vertical>
                            <Typography.Text className="text-base font-medium text-lightRed">
                                Premium
                            </Typography.Text>
                            <Typography.Text className="text-lg font-semibold">
                                ₹ {groupPackages?.Premium}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-normal">
                                per month
                            </Typography.Text>
                            {saveAmountPremium && saveAmountPremium > 0 && (
                                <Typography.Text className="py-1 text-xs font-normal text-textGreen">
                                    You will save ₹ {saveAmountPremium}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Col>
                </Row>
                <ServicePlanRow data={subscriptionCompareTableData} price={individualPackages} />
            </Col>
        </Row>
    );
};

export default PlansCompareTable;
