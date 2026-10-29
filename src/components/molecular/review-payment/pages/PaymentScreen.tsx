import React, { useState } from 'react';

import { Button, Card, Checkbox, Col, Divider, Flex, Row, Typography } from 'antd';

import cashfreeLogo from '@assets/images/cashfreeLogo.png';
import Logo from '@assets/svg/Logo.svg';

import BillSummary from '../components/BillSummary';
import PaymentFooter from '../components/PaymentFooter';
import PaymentHeader from '../components/PaymentHeader';
import PaymentOptions from '../components/PaymentOptions';
import { summaryTexts } from '../types/type';
import { billSummary, paymentSummary } from '../utils/data';

const { Text } = Typography;

interface ReviewPaymentType {
    title: string;
    totalAmount?: number | string;
    cashbackBalance?: string | number;
    paymentFunction: () => void;
    isBBPSService?: boolean;
    billSummaryArray: summaryTexts[];
    paymentSummaryArray: summaryTexts[];
}
const ReviewPayment = ({
    title,
    totalAmount,
    cashbackBalance,
    paymentFunction,
    billSummaryArray,
    paymentSummaryArray,
    isBBPSService = false,
}: ReviewPaymentType) => {
    const [selectedPayment, setselectedPayment] = useState<string>('PEKO-WALLET');
    const [useCashbackChecked, setUseCashbackChecked] = useState<boolean>(false);
    const [isPaymentBtnClicked, setIsPaymentBtnClicked] = useState<boolean>(false);

    const handlePayment = () => {
        setIsPaymentBtnClicked(true);

        setTimeout(() => {
            setIsPaymentBtnClicked(false);
        }, 3000);

        paymentFunction();
    };

    const summaryOption = billSummaryArray ?? billSummary;
    const paymentSummaryOption = paymentSummaryArray ?? paymentSummary;
    return (
        <Row>
            <PaymentHeader isBBPSService={isBBPSService} />
            <Divider />
            <Col xs={24} xl={12}>
                <Card
                    className="rounded-2xl border border-borderGray h-full md:p-10 p-5 "
                    styles={{ body: { padding: 0 } }}
                >
                    <Flex vertical gap={25}>
                        <Typography.Title level={5}>{title ?? 'Bill Summary'}</Typography.Title>
                        {summaryOption.map(item => (
                            <BillSummary
                                key={item.key}
                                headName={item.key}
                                value={item.value}
                                isInput={item.isInput}
                            />
                        ))}
                        <Typography.Title level={5}>Total Payment Summary</Typography.Title>
                        {paymentSummaryOption.map(item => (
                            <BillSummary headName={item.key} value={item.value} key={item.key} />
                        ))}
                        <Row justify="space-between">
                            <Col span={16}>
                                <Typography.Title level={5}>Amount Payable</Typography.Title>
                            </Col>
                            <Col span={8}>
                                <Text className="text-base font-medium">{totalAmount}</Text>
                            </Col>
                        </Row>
                    </Flex>
                </Card>
            </Col>
            <Col xs={24} xl={{ span: 11, offset: 1 }} className="my-5 xl:my-0 ">
                <Card
                    className="rounded-2xl border border-borderGray h-full md:p-10 p-5 bg-bgGrayF9"
                    styles={{ body: { padding: 0 } }}
                >
                    <Flex vertical gap={25}>
                        <Typography.Title level={4}>Choose Your Payment Method</Typography.Title>

                        <PaymentOptions
                            optionName="Peko Cashback:"
                            walletAmount={cashbackBalance}
                            image={Logo}
                            checked={selectedPayment === 'PEKO-WALLET'}
                            handleSelection={() => setselectedPayment('PEKO-WALLET')}
                        />

                        <Checkbox
                            defaultChecked={useCashbackChecked}
                            onChange={() => setUseCashbackChecked(true)}
                            className="w-fit"
                        >
                            Use your Cashback &nbsp; ₹ {cashbackBalance}
                        </Checkbox>

                        <PaymentOptions
                            optionName="BHIM/UPI/Credit Card/Debit Card/Bank Account"
                            image={cashfreeLogo}
                            checked={selectedPayment === 'PAYTM'}
                            handleSelection={() => setselectedPayment('PAYTM')}
                        />

                        <Button
                            style={{ color: 'white' }}
                            className="bg-bgOrange2 text-white h-16 text-xl rounded-sm "
                            loading={isPaymentBtnClicked}
                            onClick={handlePayment}
                        >
                            Pay ₹ {totalAmount}
                        </Button>
                    </Flex>
                </Card>
            </Col>
            <PaymentFooter />
        </Row>
    );
};

export default ReviewPayment;
