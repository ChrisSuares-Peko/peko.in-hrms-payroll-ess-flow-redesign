import React from 'react';

import { Col, Image, Typography } from 'antd';

import BharathConnect from '@src/domains/dashboard/billPayments/assets/svg/BharatConnect.svg';

import { checkIsBBPS } from '../utils/utils';

interface PaymentHeaderProps {
    accessKeyName?: string;
}

const PaymentHeader = ({ accessKeyName }: PaymentHeaderProps) => (
    <Col xs={24} className="flex items-center justify-between mb-8">
        <Typography.Title level={4} className="m-0">
            Review your payment
        </Typography.Title>
        {accessKeyName && checkIsBBPS(accessKeyName) && (
            <Image src={BharathConnect} width={90} preview={false} />
        )}
    </Col>
);

export default PaymentHeader;
