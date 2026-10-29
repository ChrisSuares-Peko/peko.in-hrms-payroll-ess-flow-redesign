import React from 'react';

import { Button, Divider, Flex, Tag, Typography } from 'antd';

import cashfreeLogo from '@assets/images/cashfreeLogo.png';
import PaymentOptions from '@components/molecular/review-payment/components/PaymentOptions';
import { FRONTEND_BASE_URL } from '@src/config-global';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import AddonDetails from './AddonDetails';
import useGetAddonPricing from '../../hooks/useGetAddonPricing';
import usePaymentRequest from '../../hooks/usePaymentRequset';
import { formatTaxLabel } from '../../utils';
import { BoldText, GrayText } from '../CustomText';

type Props = {
    addOnpaymentPayload: {
        addonsAccessKey: string;
        packageId: number;
        pgAmount: number;
        quantity: number;
        isDynamicUnitPricing?: boolean;
        title: string;
        description: string;
        rows: {
            column1: string;
            column2: string;
            column3: string;
        }[];
    };
    planId: number;
};

const MandateAddonCard = ({ addOnpaymentPayload, planId }: Props) => {
    const { lg } = useScreenSize();
    const { handlePaymentRequest, isLoading: paymentLoading } = usePaymentRequest();
    const {
        description,
        rows,
        title,
        pgAmount,
        addonsAccessKey,
        packageId,
        quantity,
        isDynamicUnitPricing,
    } = addOnpaymentPayload;

    const { quote, isLoading: quoteLoading } = useGetAddonPricing({ addonsAccessKey, quantity });
    const basePrice = quote ? quote.taxableAmount : pgAmount;
    const finalPrice = quote ? quote.expectedPaymentAmount : pgAmount;

    const handlePurchase = () => {
        // Addon-with-mandate purchases go straight through Cashfree's checkout SDK (see
        // usePaymentRequset.ts) rather than the shared payments domain, so they never touch the
        // generic checkout/payment-result mechanism — tracked directly here instead, mirroring
        // PlanDetailsCard.tsx's own individual-package checkout event. plans/pages/PaymentSuccess.tsx
        // is still the landing page (see handlePaymentRequest), so seeding paymentResult here is
        // enough for its existing dynamic ${service}_payment_result handling to pick it up.
        const moengageServiceName = title?.toLowerCase().replace(/\s+/g, '_');
        if (moengageServiceName) {
            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event(`${moengageServiceName}_checkout`, {
                    [`${moengageServiceName}_plan`]: 'monthly',
                    coupon_code_used: false,
                    total_amount: pgAmount,
                });
            }
            sessionStorage.setItem(
                'paymentResult',
                JSON.stringify({
                    total_amount: pgAmount,
                    serviceName: title,
                    isGroupPlan: false,
                })
            );
        }
        handlePaymentRequest({
            isMandate: true,
            amount: finalPrice,
            packageId: planId,
            billingType: 'MONTHLY',
            successUrl: `${FRONTEND_BASE_URL}/${paths.plans.index}/${paths.plans.paymentsuccess}`,
            failureUrl: `${FRONTEND_BASE_URL}/${paths.plans.index}/${paths.plans.paymentFailure}`,
            currentUrl: window.location.href,
            accessKey: accessKeys.purchaseSubscription,
            addonQuantity: quantity,
            addonsAccessKey,
            addonPackageId: packageId,
            isDynamicUnitPricing,
        });
    };

    return (
        <Flex gap={30} vertical={!lg}>
            <Flex vertical gap={16} className="w-full lg:w-4/6">
                <Tag color="blue" className="w-fit text-sm px-3 py-1">
                    Recurring Subscription Setup
                </Tag>
                <Typography.Text className="text-sm text-gray-500">
                    Your first payment sets up auto-billing for future employee additions. The
                    backend will activate the employees below immediately.
                </Typography.Text>
                <AddonDetails title={title} description={description} rows={rows} />
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
                    {quote && quote.taxAmount > 0 && (
                        <Flex justify="space-between">
                            <GrayText text={formatTaxLabel(quote.taxRate)} />
                            <BoldText text={`₹ ${formatNumberWithLocalString(quote.taxAmount)}`} />
                        </Flex>
                    )}
                    <Divider />
                    <Flex justify="space-between">
                        <BoldText text="Total Amount" />
                        <BoldText text={`₹ ${formatNumberWithLocalString(finalPrice)}`} />
                    </Flex>
                    <Button
                        loading={paymentLoading || quoteLoading}
                        onClick={handlePurchase}
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

export default MandateAddonCard;
