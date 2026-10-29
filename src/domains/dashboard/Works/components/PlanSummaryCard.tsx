import React from 'react';

import { Card, Col, Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import worksPlanList from '@src/domains/dashboard/Works/assets/svg/worksPlanList.svg';

interface planProps {
    // id?: number | null;
    name?: string | null;
    price?: string | null;
    features?: string | null;
    // description?: string | null;
}
const PlanSummaryCard = ({ name, price, features }: planProps) => {
    const data = features?.split('\n');
    const isFeaturesValid = Array.isArray(data) && data.length > 0;
    return (
        <Col xs={24} md={10} lg={12} xl={8}>
            <Card bordered className=" border-2 rounded-xl h-full">
                <Flex vertical>
                    <Typography.Text className=" md:text-xl   text-lg font-normal">
                        {name}
                    </Typography.Text>

                    {/* <Typography.Text className="text-gray-400 ">{description}</Typography.Text> */}
                </Flex>
                <Flex align="center">
                    <Typography.Text className="text-3xl font-normal mt-2">{price}</Typography.Text>
                    {/* <Typography.Text className="text-sm font-normal ml-2">
                        {billingCycle}
                    </Typography.Text> */}
                </Flex>
                <Flex vertical gap={8} className="mt-2">
                    {isFeaturesValid &&
                        data?.map((value, index) => (
                            <Flex vertical key={index}>
                                {value !== '' && (
                                    <Flex gap={8}>
                                        <ReactSVG src={worksPlanList} />
                                        <Typography.Text className="text-xs font-normal">
                                            {value}
                                        </Typography.Text>
                                    </Flex>
                                )}
                            </Flex>
                        ))}
                </Flex>
            </Card>
        </Col>
    );
};

export default PlanSummaryCard;
