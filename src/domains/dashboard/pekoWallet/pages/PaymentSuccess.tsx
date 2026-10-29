import React, { lazy, useEffect } from 'react';

import { Result, Flex, Button, Skeleton } from 'antd';
import Lottie from 'react-lottie';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { paths } from '@src/routes/paths';

import useGetTransactionData from '../hooks/useTransactionData';
import { resetAmount } from '../slice/WalletSlice';

const PaymentTable = lazy(
    () => import('@domains/dashboard/payments/components/PaymentResultTable')
);

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const PaymentSuccess = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status')?.replace(/["']/g, '');
    const transactionId = queryParams.get('transactionId');
    const { transactionData, isLoading } = useGetTransactionData(transactionId);
    const subTitleMessage = 'You’ve successfully added funds to your wallet.';
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (status !== 'success' || !transactionId) {
            navigate(`/${paths.dashboard.pekoWallet}`);
        }
    }, [status, transactionId, navigate]);

    useEffect(() => {
        if (!isLoading) {
            if (!transactionData || transactionData.transactionCategory !== 'RECHARGE WALLET') {
                navigate(`/${paths.dashboard.pekoWallet}`);
            } else {
                dispatch(resetAmount());
            }
        }
    }, [isLoading, transactionData, dispatch, navigate]);

    if (isLoading || !transactionData) {
        return (
            <Flex align="center" justify="center" className="min-h-[300px]">
                <Skeleton active />
            </Flex>
        );
    }

    const { transactionDate, corporateTxnId, creditAmount } = transactionData;

    const tableData = {
        transactionDate,
        corporateTxnId,
        amount: creditAmount,
        paymentMode: 'PAYMENT GATEWAY',
        serviceProvider: 'Peko Wallet',
    };
    return (
        <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
            <Result
                className="p-0 md:w-3/6"
                icon={<Lottie options={defaultOptions} height={100} />}
                status="success"
                title={!isLoading && 'Wallet Top-Up Successful'}
                subTitle={!isLoading && subTitleMessage}
                extra={[
                    isLoading ? (
                        <Flex>
                            <Skeleton.Button
                                key="skeleton"
                                style={{ minWidth: 400, height: 30 }}
                                active
                            />
                            {/* <Skeleton.Button
                                    key="skeleton"
                                    style={{ minWidth: 200, height: 20 }}
                                    className="w-full"
                                    active
                                /> */}
                        </Flex>
                    ) : (
                        <Flex
                            justify="center"
                            className="flex flex-col gap-4 sm:flex-row"
                            key="btn"
                        >
                            <Link to="/dashboard">
                                <Button type="primary" danger>
                                    Go to Dashboard
                                </Button>
                            </Link>
                            <Link to="/peko-wallet">
                                <Button>Go to Wallet</Button>
                            </Link>
                        </Flex>
                    ),
                ]}
            />
            <PaymentTable paymentData={tableData} />
        </Flex>
    );
};

export default PaymentSuccess;
