import React from 'react';

import { Col, Flex, Image, Typography } from 'antd';

import bbpsLogo from '../assets/images/bbpsLogo.png';

const PaymentHeader: React.FC<{ isBBPSService?: boolean }> = ({ isBBPSService = false }) => (
    <Col xs={24} xl={12}>
        <Flex justify="space-between" align="center">
            <Typography.Title level={4}>Review Your Payment</Typography.Title>
            {isBBPSService && <Image src={bbpsLogo} width={70} preview={false} />}
        </Flex>
    </Col>
);

export default PaymentHeader;
