import { useEffect, useState } from 'react';

import { Button, Flex, Result, Skeleton, Typography } from 'antd';
import Lottie from 'react-lottie';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { useAppDispatch } from '@src/hooks/store';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';

import useGetTransactionData from '../../payments/hooks/useGetTransactionData';
import { resetPaymentData } from '../../payments/slices/payment';
import { resetPaymentState } from '../../Subscriptions/slice/paymentSlice';

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const PaymentSuccess = () => {
    useUserInfo();
    const navigate = useNavigate();
    const [redirectUrl, setRedirectUrl] = useState(`${paths.dashboard.ecommerce}`);
    const dispatch = useAppDispatch();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status')?.replace(/["']/g, '');
    const transactionId = queryParams.get('transactionId');
    const firstBtnLink = paths.dashboard.ecommerce;
    const { transactionData, isLoading } = useGetTransactionData(transactionId);

    useEffect(() => {
        dispatch(resetPaymentData());
        dispatch(resetPaymentState());
        if (status !== 'success') {
            navigate(paths.dashboard.home);
        }
        const storedUrl = sessionStorage.getItem('PurchaseUrl');
        if (storedUrl) {
            const { url } = JSON.parse(storedUrl);
            setRedirectUrl(url);
        }
        return () => {
            sessionStorage.removeItem('PurchaseUrl');
        };
    }, [dispatch, navigate, status]);

    useEffect(() => {
        const result = sessionStorage.getItem('paymentResult');
        if (typeof Moengage?.track_event === 'function' && result && transactionData) {
            const successData = JSON.parse(result);

            Moengage.track_event(`${successData?.serviceName}_payment_result`, {
                status: 'success',
                ...successData,
            });
            sessionStorage.removeItem('paymentResult');
        }
    }, [transactionData]);

    useEffect(() => {
        function handlePopState() {
            navigate(firstBtnLink);
            window.removeEventListener('popstate', handlePopState);
        }

        window.history.pushState(null, '', window.location.pathname);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [navigate, firstBtnLink]);

    return (
        <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
            <Result
                className="p-0 md:w-3/6"
                icon={<Lottie options={defaultOptions} height={100} />}
                status="success"
                title={!isLoading}
                subTitle={
                    isLoading ? (
                        <Skeleton
                            style={{ minWidth: 400, height: 10 }}
                            paragraph={{ rows: 2 }}
                            active
                        />
                    ) : (
                        <Flex vertical gap={3}>
                            <Typography.Text strong className="block text-lg">
                                You have successfully purchased Peko Commerce plan
                            </Typography.Text>
                            <Typography.Text className="block mt-2 text-base text-gray-600">
                                You will receive a confirmation email shortly. Thank you for
                                choosing Peko.
                            </Typography.Text>
                        </Flex>
                    )
                }
                extra={[
                    isLoading ? (
                        <Skeleton.Button
                            key="skeleton"
                            style={{ minWidth: 400, height: 30 }}
                            active
                        />
                    ) : (
                        <Flex
                            justify="center"
                            className="flex flex-col sm:flex-row gap-4"
                            key="btn"
                        >
                            <Link to={`${redirectUrl}`}>
                                <Button type="primary" danger>
                                    Go to Peko Commerce
                                </Button>
                            </Link>
                            <Link to={`/${paths.settings.index}`} state={{ activeTab: '3' }}>
                                <Button>View Your Subscription</Button>
                            </Link>
                        </Flex>
                    ),
                ]}
            />
        </Flex>
    );
};

export default PaymentSuccess;
