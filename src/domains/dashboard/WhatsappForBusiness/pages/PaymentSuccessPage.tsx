/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

import { Button, Flex, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Lottie from 'react-lottie';
import { Link, useNavigate } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';

import { useGenerateEmbeddedSignupURL } from '../hooks/useGenerateEmbeddedSignupURL';
import GetAllProjects from '../hooks/useGetProjects';

const { Text } = Typography;

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const PaymentSuccess = () => {
    useUserInfo();
    const navigate = useNavigate();
    // Gate the success render on a single-use session token written by the purchase flow.
    // We compute showSuccess synchronously from sessionStorage at mount via the lazy useState
    // initializer, then consume the token in the effect below. This is more robust than the
    // cleanup-on-unmount approach: even if unmount cleanup never fires (Strict Mode dev,
    // back-forward cache, full-page nav), the token is gone after the first read, so
    // browser-back can never re-render the success page.
    const [showSuccess] = useState(() => !!sessionStorage.getItem('PurchaseUrl'));
    const [redirectUrl, setRedirectUrl] = useState(`${paths.dashboard.whatsappForBusiness}`);
    const { generateURL, isLoading: embeddedLoading } = useGenerateEmbeddedSignupURL();

    const { projectData, isLoading } = GetAllProjects();

    const handleApplyNowClick = async (projectId: string) => {
        // setAccountStatusLoading(projectId);
        try {
            const response = await generateURL(projectId);
            if (response && response.embeddedSignupURL) {
                window.open(response.embeddedSignupURL, '_blank');
            } else {
                console.error('Embedded signup URL is missing.');
            }
        } catch (error) {
            console.error('Error generating URL:', error);
        }
    };

    useEffect(() => {
        if (showSuccess) {
            // Read the redirect target from the token, then consume the token so any
            // subsequent mount (browser back, direct URL) finds an empty session.
            const storedUrl = sessionStorage.getItem('PurchaseUrl');
            if (storedUrl) {
                try {
                    const { url } = JSON.parse(storedUrl);
                    if (url) setRedirectUrl(url);
                } catch {
                    // Bad JSON — fall back to the default redirect.
                }
                sessionStorage.removeItem('PurchaseUrl');
            }
        } else {
            // No token → not a fresh purchase. Bounce the user out so the back button
            // doesn't loop them back into the success screen.
            navigate(paths.dashboard.whatsappForBusiness, { replace: true });
        }
    }, [showSuccess, navigate]);

    // const handleClick = () => {
    //     navigate(`/${paths.settings.index}`, { state: { activeTab: '2' } });
    // };

    if (!showSuccess) {
        // Brief Skeleton while the useEffect navigates away — prevents a flash of the success
        // animation/text when the user reaches this route without a fresh-purchase token.
        return (
            <Content className="flex items-center justify-center px-4 py-8 bg-white">
                <div className="w-full max-w-xl">
                    <Skeleton active />
                </div>
            </Content>
        );
    }

    return (
        <Content className="flex items-center justify-center px-4 py-8 bg-white">
            <Flex vertical align="center" className="w-full max-w-xl text-center">
                <Flex justify="center" className="mb-6">
                    <Lottie options={defaultOptions} height={100} />
                </Flex>
                <Text className="block text-xl font-medium sm:text-2xl">
                    You have successfully purchased WhatsApp for Business plan
                </Text>
                <Text className="block mt-2 text-sm text-gray-600 sm:text-base">
                    You will receive a confirmation email shortly. Thank you for choosing Peko.
                </Text>
                <Flex wrap="wrap" gap={12} justify="center" className="w-full mt-8">
                    {!projectData?.[0]?.is_whatsapp_verified && (
                        <Button
                            type="default"
                            onClick={() => handleApplyNowClick(projectData?.[0].id ?? '')}
                            danger
                        >
                            Verify your WhatsApp for Business Account
                        </Button>
                    )}
                    <Link to={redirectUrl}>
                        <Button type="default" danger>
                            Go to WhatsApp for Business
                        </Button>
                    </Link>
                </Flex>
            </Flex>
        </Content>
    );
};

export default PaymentSuccess;
