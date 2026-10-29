import React, { useEffect, useState } from 'react';

import { Button, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Lottie from 'react-lottie';
import { Link } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';

const { Text } = Typography;

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const PaymentSuccessBotBuilder = () => {
    useUserInfo();
    // const { branding } = useAppSelector(state => state.reducer.auth);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [redirectUrl, setRedirectUrl] = useState(`${paths.dashboard.home}`);

    useEffect(() => {
        const storedUrl = sessionStorage.getItem('PurchaseUrl');
        if (storedUrl) {
            const { url } = JSON.parse(storedUrl);
            setRedirectUrl(url);
        }
        return () => {
            sessionStorage.removeItem('PurchaseUrl');
        };
    }, []);

    return (
        <Content className="flex items-center justify-center px-4 py-8 bg-white">
            <Flex vertical align="center" className="w-full max-w-xl text-center">
                <Flex justify="center" className="mb-6">
                    <Lottie options={defaultOptions} height={100} />
                </Flex>
                <Text className="block text-xl font-medium sm:text-2xl">
                    You have successfully purchased WhatsApp for Business Add on
                </Text>
                <Text className="block mt-2 text-sm text-gray-600 sm:text-base">
                    You will receive a confirmation email shortly. Thank you for choosing Peko.
                </Text>
                <Flex wrap="wrap" gap={12} justify="center" className="w-full mt-8">
                    <Link to={paths.dashboard.whatsappForBusiness}>
                        <Button type="primary" danger>
                            Go to WhatsApp for Business
                        </Button>
                    </Link>
                    <Link
                        to={`${paths.dashboard.whatsappForBusiness}/${paths.whatsappForBusiness.reviewOrder}`}
                    >
                        <Button>View Transaction</Button>
                    </Link>
                </Flex>
            </Flex>
        </Content>
    );
};

export default PaymentSuccessBotBuilder;
