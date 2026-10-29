import React from 'react';

import { Button, Divider, Flex, Typography } from 'antd';

import cashfreeLogo from '@assets/images/cashfreeLogo.png';
// import walletIcon from '@domains/dashboard/plans/assets/icons/wallet.svg';
import PaymentOptions from '@components/molecular/review-payment/components/PaymentOptions';
// import { useAppDispatch, useAppSelector } from '@src/hooks/store';
// import { showToast } from '@src/slices/apiSlice';
import useScreenSize from '@src/hooks/useScreenSize';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import AddonDetails from './AddonDetails';
import useGetAddonPricing from '../../hooks/useGetAddonPricing';
import usePaymentRequest from '../../hooks/usePaymentRequset';
import { formatTaxLabel } from '../../utils';
import { BoldText, GrayText } from '../CustomText';

type Props = {
    paymentPayload: {
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
};

const AddonDetailCard = ({ paymentPayload }: Props) => {
    const { lg } = useScreenSize();
    const { Text } = Typography;
    // const dispatch = useAppDispatch();
    // const walletBalance = useAppSelector(state => state.reducer.user.user?.balance ?? 0);
    const { handleAddOnPaymentRequest, isLoading: paymentLoading } = usePaymentRequest();
    const { description, rows, title, ...rest } = paymentPayload;

    const { quote, isLoading: quoteLoading } = useGetAddonPricing({
        addonsAccessKey: rest.addonsAccessKey,
        quantity: rest.quantity,
    });
    const basePrice = quote ? quote.taxableAmount : paymentPayload.pgAmount;
    const finalPrice = quote ? quote.expectedPaymentAmount : paymentPayload.pgAmount;

    const handleSubscribePackage = () => {
        // Wallet balance check (commented — addon payments now go via payment gateway)
        // if (rest.pgAmount > 0 && Number(walletBalance) < rest.pgAmount) {
        //     dispatch(
        //         showToast({
        //             description: `Insufficient wallet balance. Available balance: ₹ ${formatNumberWithLocalString(walletBalance)}. Please add funds to continue.`,
        //             variant: 'error',
        //         })
        //     );
        //     return;
        // }
        // Same reasoning as MandateAddonCard.tsx: this addon flow never reaches the shared
        // payments domain (Cashfree checkout SDK is called directly), so tracking happens here,
        // with paymentResult seeded for plans/pages/PaymentSuccess.tsx to pick up.
        // The Turbo fleet add-on ("Manage Subscription") shares this component with every other
        // addon, but needs its own turbo_subscription_* event names, distinct from the plain
        // turbo_checkout/turbo_payment_result fired by the initial Turbo plan purchase
        // (PlanDetailsCard.tsx) — both would otherwise derive the same "turbo" prefix from title.
        const isTurboFleetAddon = rest.addonsAccessKey === accessKeys.garage;
        const moengageServiceName = isTurboFleetAddon
            ? 'turbo_subscription'
            : title?.toLowerCase().replace(/\s+/g, '_');
        if (moengageServiceName) {
            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event(`${moengageServiceName}_checkout`, {
                    coupon_code_used: false,
                    total_amount: finalPrice,
                });
            }
            sessionStorage.setItem(
                'paymentResult',
                JSON.stringify({
                    total_amount: finalPrice,
                    serviceName: isTurboFleetAddon ? 'Turbo Subscription' : title,
                    isGroupPlan: false,
                })
            );
        }
        handleAddOnPaymentRequest({
            pgAmount: finalPrice,
            addonsAccessKey: rest.addonsAccessKey,
            packageId: rest.packageId,
            quantity: rest.quantity,
            isDynamicUnitPricing: rest.isDynamicUnitPricing,
        });
    };

    return (
        <Flex gap={30} vertical={!lg}>
            <AddonDetails title={title} description={description} rows={rows} />
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

                    {/* Wallet option (commented — temporarily disabled) */}
                    {/* <PaymentOptions
                        optionName="Peko Wallet"
                        walletAmount={walletBalance}
                        image={walletIcon}
                        checked={false}
                        handleSelection={() => {}}
                    /> */}
                </Flex>

                <Flex
                    className="w-full h-auto px-8 py-6 text-xs border border-gray-200 border-solid rounded-xl"
                    justify="space-between"
                    vertical
                    gap={18}
                >
                    <Text className="text-lg font-medium text-zinc-900">Total Amount</Text>
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
                        onClick={handleSubscribePackage}
                        htmlType="submit"
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

export default AddonDetailCard;
