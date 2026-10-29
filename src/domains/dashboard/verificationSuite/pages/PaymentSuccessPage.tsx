import React, { useEffect } from 'react';

import { Button, Flex, Result, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Lottie from 'react-lottie';
import { useNavigate } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { resetPaymentData } from '../../payments/slices/payment';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const PaymentSuccessPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(
        () => () => {
            dispatch(resetPaymentData());
        },
        [dispatch]
    );

    return (
        <Content className="flex items-center justify-center min-h-[30rem]">
            <Flex vertical justify="center" align="center" gap={20}>
                <Result
                    className="p-0"
                    icon={<Lottie options={defaultOptions} height={100} />}
                    status="success"
                    title="Add-on Purchased Successfully"
                    subTitle={
                        <Flex justify="center" className="px-2">
                            <Typography.Text>
                                Additional verifications are now available on your account.
                            </Typography.Text>
                        </Flex>
                    }
                    extra={[
                        <Button
                            key="btn"
                            type="primary"
                            danger
                            onClick={() => navigate(paths.dashboard.verificationSuite)}
                        >
                            Go to Verification Suite
                        </Button>,
                    ]}
                />
            </Flex>
        </Content>
    );
};

export default PaymentSuccessPage;
