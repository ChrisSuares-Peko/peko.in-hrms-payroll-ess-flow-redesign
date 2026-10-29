import React, { useState } from 'react';

import { Alert, Button, Flex, Progress, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { calculatePercentage } from '@utils/calculatePercentage';
import { formattedDateOnly } from '@utils/dateFormat';
import { packageAccessKeys } from '@utils/packageAccessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PlanDetails from './PlanDetails';
import SignTag from './SignTag';
import useGetESignCount from '../../hooks/useGetESignCount';

type Props = {};

const SubscriptionSettings = (props: Props) => {
    const navigate = useNavigate();
    const { user } = useAppSelector(state => state.reducer.user);
    const [signCount, setSignCount] = useState<number | null>(null);
    const [error, setError] = useState<string>();
    const [totalAmount, setTotalAmount] = useState(0);
    const { count, isLoading: countLoading } = useGetESignCount();
    const { md } = useScreenSize();
    const denominations = [5, 10, 30];
    const {
        addonData,
        purchaseData,
        isLoading: addonLoading,
    } = useGetAddonDetails(accessKeys.eSign, packageAccessKeys.eSign);
    // Free/Basic plans have no configured add-on unit price — the backend now reports this as
    // isAddonPurchaseAllowed=false instead of an error, so we disable the purchase option and prompt
    // the user to buy an individual or group subscription first.
    const canPurchaseAddon = addonData?.isAddonPurchaseAllowed === true;
    const handleUpdateCount = (sign: number) => {
        setError('');
        setSignCount(sign);
        setTotalAmount(Number(sign) * addonData!.unitPrice);
    };

    const handleUpgrade = () => {
        if (!canPurchaseAddon) {
            return;
        }
        if (!totalAmount) {
            setError('Please select number of additional eSigns.');
            return;
        }
        const addOnpaymentPayload = {
            pgAmount: totalAmount,
            addonsAccessKey: accessKeys.eSign,
            packageId: addonData?.packageId,
            quantity: signCount,
            isDynamicUnitPricing: addonData?.isDynamicUnitPricing ?? false,
            title: 'eSign',
            description: '',
            rows: [
                {
                    column1: 'Additional eSigns',
                    column2: `${signCount} eSigns`,
                    column3: `₹ ${formatNumberWithLocalString(totalAmount)}`,
                },
            ],
        };

        const currentPageUrl = window.location.href;
        sessionStorage.setItem(
            'PlanDetails',
            JSON.stringify({
                url: currentPageUrl,
                service: 'eSign',
                addOnpaymentPayload,
                isAddOns: true,
            })
        );
        navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`);
    };
    return (
        <Content>
            {!purchaseData ? (
                <Skeleton />
            ) : (
                <PlanDetails
                    purchaseData={purchaseData.currentSubscription}
                    isGroupSubscription={purchaseData.isGroupSubscription}
                />
            )}
            {purchaseData?.addOns && <PlanDetails purchaseData={purchaseData.addOns} />}

            <Flex vertical className="w-full mt-6 xl:w-2/3">
                <Typography.Text className="font-medium " style={{ fontSize: '0.9rem' }}>
                    eSign Limit
                </Typography.Text>
                {countLoading || addonLoading ? (
                    <Skeleton className="mt-2" />
                ) : (
                    <Flex
                        align={md ? 'center' : 'self-start'}
                        gap={10}
                        className="flex-col w-full mt-2 align-middle md:flex-row"
                    >
                        <Progress
                            className="w-full mt-2 md:w-5/12"
                            percent={calculatePercentage(count, addonData?.maxLimit)}
                            strokeColor="#05BE63"
                        />
                        <Typography.Text className="flex-wrap text-xs sm:text-sm">
                            {count} {count && count > 1 ? 'eSigns' : 'eSign'} used of{' '}
                            {addonData?.maxLimit} eSigns
                        </Typography.Text>
                    </Flex>
                )}
                {user?.roleName !== 'corporate sub user' && (
                    <>
                        <Typography.Text
                            className="font-medium mt-7"
                            style={{ fontSize: '0.9rem' }}
                        >
                            Manage Additional eSign
                        </Typography.Text>

                        {addonLoading && <Skeleton className="mt-3" />}
                        {!addonLoading && canPurchaseAddon && (
                            <Flex vertical>
                                <Flex align="center" wrap="wrap">
                                    <Flex className="overflow-hidden overflow-x-auto xs:flex-wrap">
                                        {denominations?.map((signs, index) => (
                                            <SignTag
                                                key={index}
                                                signs={signs}
                                                onClick={() => handleUpdateCount(signs)}
                                                selected={signCount === signs}
                                            />
                                        ))}
                                    </Flex>
                                    {totalAmount ? (
                                        <Typography.Text className="pb-5 mt-2 md:px-4 md:pb-0 sm:whitespace-nowrap text-black/70">
                                            Total additional amount{' '}
                                            <span className="font-medium text-black">
                                                ₹ {formatNumberWithLocalString(totalAmount)} for{' '}
                                                {signCount} eSigns
                                            </span>
                                        </Typography.Text>
                                    ) : (
                                        ''
                                    )}
                                </Flex>
                                <Flex className="w-full mt-4">
                                    <Alert
                                        message={`Note: The additional eSigns purchased will expire ${
                                            purchaseData?.currentSubscription?.subscriptionEndDate
                                                ? `by ${formattedDateOnly(new Date(purchaseData.currentSubscription.subscriptionEndDate))}`
                                                : 'in one month'
                                        }. Please ensure they are utilized before the expiration date.`}
                                        type="warning"
                                        showIcon
                                    />
                                </Flex>
                                <Typography.Text className="pt-1 text-red-600">
                                    {error}
                                </Typography.Text>
                                <Button
                                    className="px-6 mt-4 w-fit"
                                    type="primary"
                                    onClick={handleUpgrade}
                                    danger
                                >
                                    Continue
                                </Button>
                            </Flex>
                        )}
                        {!addonLoading && !canPurchaseAddon && (
                            <Flex
                                className="mt-3 px-4 py-3 rounded-lg border border-[#FFE0E0] border-solid bg-[#FFF7F7]"
                                align="center"
                            >
                                <Typography.Text className="text-sm font-medium text-[#FF4F4F]">
                                    Purchase an individual or group subscription to buy additional
                                    eSigns.
                                </Typography.Text>
                            </Flex>
                        )}
                    </>
                )}
            </Flex>
        </Content>
    );
};

export default SubscriptionSettings;
