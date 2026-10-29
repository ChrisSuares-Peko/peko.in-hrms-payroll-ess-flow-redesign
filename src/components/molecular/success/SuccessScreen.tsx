import React from 'react';

import { Result, Button, theme, Flex } from 'antd';
import Lottie from 'react-lottie';
import { Link } from 'react-router-dom';

import otherSuccess from '@assets/animation/other-success.json';
import paymentSuccess from '@assets/animation/paymentSuccess2.json';

interface props {
    title?: string;
    message?: string;
    firstButtonTxt?: string;
    secondButtonTxt?: string;
    children?: React.ReactNode;
    isOtherSuccess?: boolean;
    firstBtnLink?: string;
    secondBtnLink?: string;
}

const SuccessScreen = ({
    title: propTitle,
    message: propMessage,
    firstButtonTxt,
    secondButtonTxt,
    children,
    isOtherSuccess,
    firstBtnLink,
    secondBtnLink,
}: props) => {
    const defaultOptions = {
        loop: false,
        autoplay: true,
        animationData: isOtherSuccess ? otherSuccess : paymentSuccess,
        rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice',
        },
    };
    const {
        token: { colorPrimary },
    } = theme.useToken();

    const iconSize = isOtherSuccess ? 50 : 150;

    const title = propTitle ?? 'Your payment has been successful!';
    const message =
        propMessage ??
        'You will receive a confirmation email once the process is completed. Thank you for using Peko.';

    return (
        <Flex vertical justify="center" align="center" gap={30}>
            <Result
                className="md:w-3/6 p-0"
                icon={<Lottie options={defaultOptions} height={iconSize} width={iconSize} />}
                status="success"
                title={title}
                subTitle={message}
                extra={[
                    firstButtonTxt && (
                        <Link to={`/${firstBtnLink}`} key="backBtn">
                            <Button
                                style={{
                                    color: 'white',
                                    marginRight: 20,
                                    backgroundColor: colorPrimary,
                                }}
                            >
                                {firstButtonTxt ?? 'Go to dashboard'}
                            </Button>
                        </Link>
                    ),
                    secondButtonTxt && (
                        <Link to={`/${secondBtnLink}`} key="downloadBtn">
                            <Button>{secondButtonTxt ?? 'Download Receipt'} </Button>
                        </Link>
                    ),
                ]}
            />
            {children}
        </Flex>
    );
};

export default SuccessScreen;
