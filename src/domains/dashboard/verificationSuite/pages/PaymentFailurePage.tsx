import React, { useEffect } from 'react';

import { Button, Result, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { resetPaymentData } from '../../payments/slices/payment';

const PaymentFailurePage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(
        () => () => {
            dispatch(resetPaymentData());
        },
        [dispatch]
    );

    return (
        <Content className="p-10 lg:py-20 lg:px-32 xl:px-40 2xl:px-64">
            <Row className="flex items-center justify-center h-full">
                <Result
                    className="p-0 md:w-3/6"
                    status="error"
                    title="Your transaction has failed"
                    subTitle={
                        <Typography.Text className="text-sm">
                            If any amount has been deducted from your account, please be assured
                            that the refund will be processed within 7 working days.
                        </Typography.Text>
                    }
                    extra={
                        <Button
                            type="primary"
                            danger
                            className="px-6"
                            onClick={() =>
                                navigate(
                                    `${paths.dashboard.verificationSuite}/${paths.verificationSuite.settings}`
                                )
                            }
                        >
                            Try Again
                        </Button>
                    }
                />
            </Row>
        </Content>
    );
};

export default PaymentFailurePage;
