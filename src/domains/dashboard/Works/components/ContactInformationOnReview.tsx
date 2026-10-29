import React from 'react';

import { Col, Flex, Typography } from 'antd';

import FormComponent from './FormComponent';

type Props = {
    planId: string | undefined;
    workId: number | undefined;
    price: string | undefined;
    planName: string | undefined;
    workName: string;
};

function ContactInformationOnReview({ planId, workId, price, planName, workName }: Props) {
    return (
        <Col xs={24} md={14} lg={12}>
            <Typography.Title level={5}>Contact Information</Typography.Title>

            <Flex vertical align="start">
                <FormComponent
                    planId={planId}
                    workId={workId}
                    price={price}
                    planName={planName}
                    workName={workName}
                />
            </Flex>
        </Col>
    );
}

export default ContactInformationOnReview;
