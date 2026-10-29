/* eslint-disable react/jsx-no-useless-fragment */
import React from 'react';

import { Button, Flex, Row, Typography } from 'antd';
import { Link } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import CreatePaymentLink from './CreatePaymentLink';

const PaymentLink = () => (
    <Row className="mt-5">
        <Flex className="w-full" justify="space-between" align="center">
            <Typography.Text className="text-valueText text-2xl">
                Create Payment Link
            </Typography.Text>
            <>
                <Link to={`${paths.invoice.orderHistory}`}>
                    <Button danger className="text-xs md:text-sm">
                        Order History
                    </Button>
                </Link>
            </>
        </Flex>
        <CreatePaymentLink />
    </Row>
);

export default PaymentLink;
