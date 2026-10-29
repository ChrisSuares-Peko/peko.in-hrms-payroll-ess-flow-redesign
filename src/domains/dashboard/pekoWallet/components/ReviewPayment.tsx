import React, { useEffect, useState } from 'react';

import { Button, Divider, Flex, Typography } from 'antd';
import { useDispatch } from 'react-redux';

import cashfreeLogo from '@src/assets/images/cashfreeLogo.png';
import { FRONTEND_BASE_URL } from '@src/config-global';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PaymentMethod from './PaymentMethod';
import usePaymentRequest from '../hooks/usePaymentRequest';
import { setAmount } from '../slice/WalletSlice';
import { walletPaymentMode } from '../types';

type walletTypes = {
    selectedAmount: any;
};
const ReviewPayment = ({ selectedAmount }: walletTypes) => {
    const [checkoutJsInstance, setCheckoutJsInstance] = useState(null);
    const { Text, Title } = Typography;
    const dispatch = useDispatch();
    const {
        handlePaymentRequest,
        isLoading: paymentLoading,
        selectedPaymentMode,
        setselectedPaymentMode,
        loadCheckoutScript,
    } = usePaymentRequest({ setCheckoutJsInstance, checkoutJsInstance });

    const amount = selectedAmount ?? 0;

    const handleSubscribePackage = () => {
        dispatch(setAmount(amount));
        if (!amount || amount <= 0) return;

        handlePaymentRequest({
            amount,
            successUrl: `${FRONTEND_BASE_URL}/${paths.pekoWallet.index}/${paths.pekoWallet.paymentsuccess}`,
            failureUrl: `/${paths.pekoWallet.index}/${paths.pekoWallet.paymentFailure}`,
            currentUrl: window.location.href,
        });
    };

    useEffect(() => {
        loadCheckoutScript();
    }, [loadCheckoutScript]);

    return (
        <Flex vertical gap={40}>
            <Flex
                className="w-full px-6 py-8 text-xs border border-gray-200 border-solid rounded-xl"
                justify="space-between"
                align="flex-start"
                vertical
                gap={24}
            >
                <Text className="text-lg font-medium">Select Payment Method</Text>
                <PaymentMethod
                    icon={cashfreeLogo}
                    label="BHIM/UPI/Credit Card/Debit Card/Bank Account"
                    checked={selectedPaymentMode === walletPaymentMode.card}
                    handleClick={() => setselectedPaymentMode(walletPaymentMode.card)}
                />
            </Flex>

            <Flex
                className="w-full px-8 py-6 text-xs border border-gray-200 border-solid rounded-xl"
                justify="space-between"
                vertical
                gap={18}
            >
                <Title level={5}>Total Amount</Title>
                <Flex justify="space-between">
                    <Text className="text-sm font-normal sm:text-base">Subtotal</Text>
                    <Text className="text-sm font-medium sm:text-base">
                        {`₹ ${amount > 0 ? formatNumberWithLocalString(amount) : 0}`}
                    </Text>
                </Flex>
                <Flex justify="space-between">
                    <Text className="text-sm font-normal sm:text-base">Tax</Text>
                    <Text className="text-sm font-medium sm:text-base">{`₹ ${0}`}</Text>
                </Flex>
                <Flex justify="space-between">
                    <Text className="text-sm font-normal sm:text-base">Convenience fee</Text>
                    <Text className="text-sm font-medium sm:text-base">{`₹ ${0}`}</Text>
                </Flex>

                <Divider />
                <Flex justify="space-between">
                    <Title level={5}>Total Amount</Title>
                    <Title
                        level={5}
                    >{`₹ ${amount > 0 ? formatNumberWithLocalString(amount) : 0}`}</Title>
                </Flex>
                {/* <Flex
                    className="flex items-start p-2 rounded-lg sm:p-4 bg-yellow-50 "
                    style={{ background: '#FFFCEC' }}
                >
                    <ExclamationCircleFilled className="mt-1 mr-2 text-yellow-500" />
                    <Flex>
                        <Text>
                            Funds can only be used on Peko. No withdrawals allowed as per RBI
                            guidelines.
                        </Text>
                    </Flex>
                </Flex> */}

                <Button
                    loading={paymentLoading}
                    onClick={handleSubscribePackage}
                    htmlType="submit"
                    disabled={!amount || amount <= 0}
                    danger
                    type="primary"
                    className="w-full"
                >
                    Pay Now
                </Button>
            </Flex>
        </Flex>
    );
};

export default ReviewPayment;
