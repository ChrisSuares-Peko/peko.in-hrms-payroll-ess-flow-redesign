import React, { lazy } from 'react';

import { Result, Flex } from 'antd';
import Lottie from 'react-lottie';

import paymentSuccess from '@assets/animation/paymentSuccess2.json';
import { useAppSelector } from '@src/hooks/store';

const PaymentTable = lazy(() => import('../components/PaymentTable'));

const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: paymentSuccess,
};

const PaymentSuccess = () => {
    const { paymentLinkPayload } = useAppSelector(store => store.reducer.invoices);

    const notification = paymentLinkPayload?.notification;
    let subTitleMessage = 'The payment link has been generated successfully.';

    if (notification === 'EML') {
        subTitleMessage = "The payment link has been sent to your customer's email ID.";
    } else if (notification === 'SMS') {
        subTitleMessage = "The payment link has been sent to your customer's mobile number.";
    } else if (notification === 'ALL') {
        subTitleMessage =
            "The payment link has been sent to your customer's email ID and mobile number.";
    } else if (notification === 'LNK') {
        subTitleMessage = 'The payment link has been generated successfully.';
    }

    return (
        <Flex vertical justify="center" align="center" gap={20} className="pgsuccess">
            <Result
                className="md:w-3/6 p-0"
                icon={<Lottie options={defaultOptions} height={100} />}
                status="success"
                title="Payment Link Generated"
                subTitle={subTitleMessage}
            />
            <PaymentTable />
        </Flex>
    );
};

export default PaymentSuccess;
