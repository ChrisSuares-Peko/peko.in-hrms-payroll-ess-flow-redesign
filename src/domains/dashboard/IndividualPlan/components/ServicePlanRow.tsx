/* eslint-disable no-nested-ternary */
import React from 'react';

import { Row, Col, Flex, Typography, Divider } from 'antd';

import { DynamicNumberObject } from '@src/domains/dashboard/plans/types';

interface PlanStatus {
    key: string;
    service: string;
    services: React.ReactNode;
    premium: React.ReactNode;
    standard: React.ReactNode;
}

interface ServicePlanRowProps {
    data: PlanStatus[];
    price?: DynamicNumberObject;
}

const ServicePlanRow: React.FC<ServicePlanRowProps> = ({ data, price }) => (
    <Flex vertical gap={40} className="overflow-x-hidden ">
        {data.map((item, index) => {
            const servicePrice = price?.[item.service] ?? 0;
            return (
                <React.Fragment key={item.key}>
                    <Row align="middle" gutter={30}>
                        <Col span={6}>{item.services}</Col>
                        <Col span={6} className={`${index !== 0 ? 'flex h-full' : ''}`}>
                            {index === 0 ? (
                                <Flex
                                    className="flex-col justify-end w-full h-full"
                                    align="flex-start"
                                    vertical
                                >
                                    <Typography.Text>Free</Typography.Text>
                                    <Divider />
                                </Flex>
                            ) : servicePrice === 0 ? (
                                <Flex
                                    className="flex-col justify-end w-full h-full "
                                    align="flex-start"
                                    vertical
                                >
                                    <Typography.Text>No Plan</Typography.Text>
                                    <Divider />
                                </Flex>
                            ) : (
                                <Flex
                                    className="flex-col justify-end w-full h-full"
                                    align="flex-start"
                                    vertical
                                >
                                    <Typography.Text>INR {servicePrice}/month</Typography.Text>
                                    <Divider />
                                </Flex>
                            )}
                        </Col>
                        <Col span={6}>{item.premium}</Col>
                        <Col span={6}>{item.standard}</Col>
                    </Row>
                </React.Fragment>
            );
        })}
    </Flex>
);

export default ServicePlanRow;
