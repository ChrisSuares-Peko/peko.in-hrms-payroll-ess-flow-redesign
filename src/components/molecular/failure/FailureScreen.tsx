import React from 'react';

import { Button, Result, Row, Typography, theme } from 'antd';
import Lottie from 'react-lottie';
import { Link } from 'react-router-dom';

import paymentFailed from '@assets/animation/paymentFailed.json';

interface props {
    title?: string;
    message?: string;
    buttonRoute?: string;
}

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentFailed,
    rendererSettings: {
        preserveAspectRatio: 'xMidYMid slice',
    },
};

const { Text } = Typography;

const FailureScreen = ({ title, message, buttonRoute }: props) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();

    return (
        <Row className="justify-center">
            <Result
                icon={<Lottie options={defaultOptions} height={200} width={100} />}
                className="md:w-3/6"
                status="warning"
                title={title ?? 'Your transaction has failed'}
                subTitle={
                    <Text style={{ fontSize: '15px' }}>
                        {message ??
                            'We regret to inform you that your attempt to payment was unsuccessful. If any funds are deducted from your account, please be assured that the refund will be processed within seven working days.'}
                    </Text>
                }
                extra={
                    <Link to={`/${buttonRoute}`}>
                        <Button style={{ backgroundColor: colorPrimary, color: 'white' }}>
                            Try Again
                        </Button>
                    </Link>
                }
            />
        </Row>
    );
};
export default FailureScreen;
