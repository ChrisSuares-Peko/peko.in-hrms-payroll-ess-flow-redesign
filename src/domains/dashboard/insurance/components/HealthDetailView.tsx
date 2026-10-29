import React from 'react';

import { Col, Flex, Radio, Row, Select, Typography } from 'antd';

import PolicyPeriodCard from './PolicyPeriodCard';
import { policyOptions, policyPeriod } from '../utils/data';

const { Text } = Typography;

const HealthDetailView = () => (
    <>
        <Col xs={24} md={16} xl={8}>
            <Text className="text-lg font-medium">Cover Amount</Text>
            <Select
                placeholder="₹ 10 Lakh"
                options={policyOptions.map(option => ({
                    value: option.value,
                    label: (
                        <Flex justify="space-between" align="center" className="xs:px-3">
                            <Text className="font-semibold text-base">{option.price}</Text>
                            <Text className="text-gray-400 font-normal">{option.duration}</Text>
                        </Flex>
                    ),
                }))}
                defaultValue={policyOptions[0].value}
                className="w-full mt-4 rounded-none"
            />
        </Col>

        <Col span={24}>
            <Text className="text-lg font-medium">Policy Period</Text>
            <Radio.Group
                buttonStyle="outline"
                size="large"
                defaultValue={policyPeriod[0].price}
                className="mt-4 w-full"
                name="policyPeriod"
            >
                <Row className="gap-3">
                    {policyPeriod.map(({ discount, duration, id, price }) => (
                        <PolicyPeriodCard
                            discount={discount}
                            duration={duration}
                            price={price}
                            key={id}
                        />
                    ))}
                </Row>
            </Radio.Group>
        </Col>
    </>
);

export default HealthDetailView;
