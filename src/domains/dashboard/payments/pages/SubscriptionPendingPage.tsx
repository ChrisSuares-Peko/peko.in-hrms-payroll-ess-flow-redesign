import React, { useEffect } from 'react';

import { Button, Flex, Result, Typography } from 'antd';
import Lottie from 'react-lottie';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import pendingAnimation from '@assets/animation/fileUploading.json';
import { paths } from '@src/routes/paths';

import PendingIcon from '../assets/svg/clock.svg';
import { useSubscriptionStatusPoll } from '../hooks/useSubscriptionStatusPoll';

const { Text } = Typography;

const SubscriptionPendingPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { transactionId: stateTransactionId } = (location.state || {}) as { transactionId?: string };
    const transactionId = stateTransactionId ?? searchParams.get('transactionId') ?? undefined;
    const paymentRefId = searchParams.get('paymentRefId') ?? undefined;

    const { status, isPolling, error, countdown } = useSubscriptionStatusPoll(transactionId ?? null, paymentRefId);

    useEffect(() => {
        if (!status) return;
        if (status === 'SUCCESS') {
            navigate(
                `/${paths.plans.index}/${paths.plans.paymentsuccess}?status=success&transactionId=${transactionId ?? ''}`,
                { replace: true }
            );
        } else if (status === 'FAILED') {
            navigate(`/${paths.plans.index}/${paths.plans.paymentFailure}`, { replace: true });
        }
        // PENDING: stay on this page
    }, [status, transactionId, navigate]);

    useEffect(() => {
        if (!transactionId) {
            navigate(paths.dashboard.home, { replace: true });
        }
    }, [transactionId, navigate]);

    const isGiveUp = error?.includes('contact support');
    const isStillPending = status === 'PENDING';
    const isWaiting = !status && !error;
    const showCountdown = isWaiting && !isPolling && countdown > 0;

    const title = () => {
        if (isGiveUp) return 'Unable to confirm subscription';
        if (isPolling) return 'Confirming your subscription…';
        if (isStillPending) return 'Still processing';
        return 'Processing your subscription';
    };

    const subtitle = () => {
        if (isGiveUp) return error!;
        if (error) return error;
        if (isStillPending)
            return 'Your subscription is still being processed. You will receive a confirmation email once activated.';
        if (showCountdown)
            return `Checking status in ${countdown}s…`;
        return 'Please wait while we confirm your payment. This usually takes a few seconds.';
    };

    return (
        <Flex vertical justify="center" align="center" gap={20} className="pgsuccess md:pt-12">
            <Result
                className="w-full max-w-lg md:max-w-sm p-0 text-center"
                icon={
                    isStillPending || isGiveUp || error
                        ? <ReactSVG src={PendingIcon} className="flex justify-center items-center" />
                        : <Lottie options={{ loop: true, autoplay: true, animationData: pendingAnimation }} height={120} width={120} />
                }
                title={title()}
                subTitle={<Text>{subtitle()}</Text>}
                extra={
                    <Flex justify="center" className="flex-col sm:flex-row gap-4" key="btns">
                        {isGiveUp && (
                            <>
                                <Link to={`/${paths.settings.index}`} state={{ activeTab: '3' }}>
                                    <Button type="primary" danger>View Subscription</Button>
                                </Link>
                                <Link to="/reports">
                                    <Button>View Reports</Button>
                                </Link>
                            </>
                        )}
                    </Flex>
                }
            />
        </Flex>
    );
};

export default SubscriptionPendingPage;
