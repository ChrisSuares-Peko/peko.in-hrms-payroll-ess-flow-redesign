import React from 'react';

import { Button, Col, Row, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

type Props = {
    handleClick: () => void;
    price: number | string;
    isLoading?: boolean;
};

const PriceFooter: React.FC<Props> = ({ handleClick, price, isLoading }) => (
    <Row className="w-full">
        <Col span={12} className="mt-3">
            <Typography.Paragraph className="font-semibold text-base sm:text-lg ">
                ₹ {formatNumberWithLocalString(price)}
            </Typography.Paragraph>
            <Typography.Text className="font-normal text-gray-500 text-xs">
                Total amount
            </Typography.Text>
        </Col>
        <Col span={12} className="mt-3">
            <Button
                loading={isLoading}
                danger
                style={{ borderRadius: 2 }}
                type="primary"
                className="w-full"
                onClick={handleClick}
            >
                Continue
            </Button>
        </Col>
    </Row>
);

export default PriceFooter;
