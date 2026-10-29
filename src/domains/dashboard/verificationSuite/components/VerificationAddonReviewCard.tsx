import React, { useEffect, useState } from 'react';

import { Button, Card, Col, Divider, Flex, Row, Typography } from 'antd';

import cashfreeLogo from '@assets/images/cashfreeLogo.png';
import PaymentOptions from '@components/molecular/review-payment/components/PaymentOptions';
import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useGetAllPaymentMode from '../../payments/hooks/useGetAllPaymentMode';
import usePaymentApi from '../../payments/hooks/usePaymentApi';
import { loadRazorpayScript } from '../../payments/utils/razorpayCheckout';

const GrayText = ({ text }: { text: string }) => (
    <Typography.Text className="text-neutral-500 text-[.81rem] font-normal">
        {text}
    </Typography.Text>
);

const BoldText = ({ text }: { text: string }) => (
    <Typography.Text className="text-[.81rem] font-medium">{text}</Typography.Text>
);

const AddonRow = ({
    label,
    quantityText,
    priceText,
}: {
    label: string;
    quantityText: string;
    priceText: string;
}) => (
    <Row>
        <Col xl={8} xs={24}>
            <Typography.Text className="xs:font-medium xl:font-normal">{label}</Typography.Text>
        </Col>
        <Col xl={9} xs={12} className="xs:mt-2 xl:mt-0">
            <Typography.Text className="font-normal">{quantityText}</Typography.Text>
        </Col>
        <Col xl={7} xs={12} className="xs:mt-2 md:mt-0">
            <Typography.Text className="font-normal">{priceText}</Typography.Text>
        </Col>
    </Row>
);

const VerificationAddonReviewCard = () => {
    const { lg } = useScreenSize();
    const { paymentSummary, totalAmount, title, payload } = useAppSelector(
        state => state.reducer.payment
    );
    const quantity = Number(payload?.quantity) || 0;
    const [checkoutJsInstance, setCheckoutJsInstance] = useState(null);
    const { handlePaytmPaymentRequest, isLoading, loadCheckoutScript } = usePaymentApi({
        checkoutJsInstance,
        setCheckoutJsInstance,
        successBasePath: paths.dashboard.verificationSuite,
    });

    const { availablePgOptions } = useGetAllPaymentMode();
    const pgProvider = availablePgOptions.gateway.provider;

    useEffect(() => {
        if (pgProvider === 'RAZORPAY') {
            loadRazorpayScript();
        } else {
            loadCheckoutScript();
        }
    }, [loadCheckoutScript, pgProvider]);

    const basePrice = Number(payload?.amount) || 0;

    return (
        <Flex gap={30} vertical={!lg}>
            <Flex vertical className="w-full lg:w-4/6">
                <Card
                    className="p-3 border-0 sm:rounded-2xl sm:border border-borderGray md:p-7"
                    styles={{ body: { padding: 0 } }}
                >
                    <Typography.Title level={5}>{title || 'Verification Suite'}</Typography.Title>
                    <Divider />
                    <Flex vertical className="w-full mt-5" gap={15}>
                        <AddonRow
                            label="Additional Verifications"
                            quantityText={`${quantity} Verifications`}
                            priceText={`₹ ${formatNumberWithLocalString(basePrice)}`}
                        />
                    </Flex>
                </Card>
            </Flex>
            <Flex
                className="w-full h-full text-xs md:w-4/6 lg:w-2/6"
                justify="space-between"
                align="flex-start"
                vertical
                gap={24}
            >
                <Flex
                    className="w-full h-full px-6 py-8 text-xs border border-gray-200 border-solid rounded-xl"
                    justify="space-between"
                    align="flex-start"
                    vertical
                    gap={24}
                >
                    <Typography.Text className="text-lg font-medium">
                        Select Payment Method
                    </Typography.Text>

                    <PaymentOptions
                        optionName="UPI / Credit Card / Debit Card"
                        image={cashfreeLogo}
                        checked
                        handleSelection={() => {}}
                    />
                </Flex>

                <Flex
                    className="w-full h-auto px-8 py-6 text-xs border border-gray-200 border-solid rounded-xl"
                    justify="space-between"
                    vertical
                    gap={18}
                >
                    <Typography.Text className="text-lg font-medium text-zinc-900">
                        Total Amount
                    </Typography.Text>
                    <Flex justify="space-between">
                        <GrayText text="Base Price" />
                        <BoldText text={`₹ ${formatNumberWithLocalString(basePrice)}`} />
                    </Flex>
                    {paymentSummary.map(item => (
                        <Flex justify="space-between" key={item.key}>
                            <GrayText text={item.key} />
                            <BoldText text={String(item.value)} />
                        </Flex>
                    ))}
                    <Divider />
                    <Flex justify="space-between">
                        <BoldText text="Total Amount" />
                        <BoldText text={`₹ ${formatNumberWithLocalString(totalAmount)}`} />
                    </Flex>
                    <Button
                        loading={isLoading}
                        onClick={() =>
                            handlePaytmPaymentRequest({
                                isChecked: false,
                                balance: 0,
                                gateway: pgProvider,
                            })
                        }
                        danger
                        type="primary"
                        className="w-full"
                    >
                        Pay Now
                    </Button>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default VerificationAddonReviewCard;
