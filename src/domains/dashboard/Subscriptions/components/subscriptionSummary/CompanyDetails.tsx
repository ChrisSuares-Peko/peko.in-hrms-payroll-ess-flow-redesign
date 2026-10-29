import React from 'react';

import { Col, Flex, Typography } from 'antd';

import FormComponent from '@domains/dashboard/Subscriptions/components/subscriptionSummary/FormComponent';

type Props = {};
const { Text, Title } = Typography;

function CompanyDetails(props: Props) {
    return (
        <Col xs={24} md={14} lg={12}>
            <Flex
                justify="center"
                className="p-3 rounded-sm border border-solid border-green-200   bg-green-50 w-full md:w-3/4"
            >
                <Text className="text-[.8rem]   font-normal text-textGreenTitle">
                    Note: The license key will be sent to your email upon completing the purchase
                </Text>
            </Flex>
            <Title level={5} className="my-6 ">
                Enter company information
            </Title>

            <Flex vertical align="start">
                <FormComponent />
            </Flex>
        </Col>
    );
}

export default CompanyDetails;
