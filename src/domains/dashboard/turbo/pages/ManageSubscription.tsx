/* eslint-disable no-unsafe-optional-chaining */
import React, { Suspense, useCallback, useState } from 'react';

import { Alert, Button, Flex, Progress, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import { cancelSubscriptionPatch } from '@src/domains/dashboard/settings/api/subscription';
import { useAppDispatch } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import FleetTag from '../components/subscription/FleetTag';
import PlanDetails from '../components/subscription/PlanDetails';
import useGetGarageUsageApi from '../hooks/useGetGarageUsage';

const ManageSubscription = () => {
    const { md } = useScreenSize();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [fleetCount, setFleetCount] = useState<number | null>(null);
    const [error, setError] = useState<string>();
    const [totalAmount, setTotalAmount] = useState(0);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const { details } = useGetGarageUsageApi();
    const denominations = [10, 20, 50];
    const { addonData, purchaseData } = useGetAddonDetails(
        accessKeys.garage,
        packageAccessKeys.garage
    );
    const canPurchaseAddon = addonData?.isAddonPurchaseAllowed === true;
    const handleUpdateCount = (fleet: number) => {
        setError('');
        setFleetCount(fleet);
        setTotalAmount(Number(fleet) * addonData!.unitPrice);
    };

    const handleUpgrade = () => {
        if (!canPurchaseAddon) {
            return;
        }
        if (!totalAmount) {
            setError('Please select the number of additional vehicles and drivers');
            return;
        }
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        const addOnpaymentPayload = {
            pgAmount: totalAmount,
            addonsAccessKey: accessKeys.garage,
            packageId: addonData?.packageId,
            quantity: fleetCount,
            isDynamicUnitPricing: addonData?.isDynamicUnitPricing ?? false,
            title: 'Turbo',
            description: '',
            rows: [
                {
                    column1: 'Additional Fleet',
                    column2: `${fleetCount} ${Number(fleetCount) === 1 ? 'Vehicle and Driver' : 'Vehicles and Drivers'}`,
                    column3: `₹ ${formatNumberWithLocalString(totalAmount)}`,
                },
            ],
        };
        const currentPageUrl = window.location.href;
        sessionStorage.setItem(
            'PlanDetails',
            JSON.stringify({
                url: currentPageUrl,
                service: 'Turbo',
                addOnpaymentPayload,
                isAddOns: true,
            })
        );
        navigate(`/${paths.plans.index}/${paths.plans.reviewOrder}`);
    };

    const handleOpenCancelModal = useCallback(() => {
        setOpenConfirmationModal(true);
    }, []);

    const handleCancelModal = useCallback(() => {
        setOpenConfirmationModal(false);
    }, []);

    const handleCancelSubscription = useCallback(async () => {
        const subscriptionId = purchaseData?.currentSubscription?.id;

        if (!subscriptionId) {
            console.error('Subscription ID not found:', purchaseData?.currentSubscription);
            dispatch(
                showToast({
                    variant: 'error',
                    description:
                        'Subscription ID not found. Please refresh the page and try again.',
                })
            );
            setOpenConfirmationModal(false);
            return;
        }

        setIsCancelling(true);
        try {
            const response = await cancelSubscriptionPatch(subscriptionId);

            if (response && response.status) {
                dispatch(
                    showToast({
                        variant: 'success',
                        description:
                            response.message ||
                            response.data?.message ||
                            'Subscription cancelled successfully',
                    })
                );
                setOpenConfirmationModal(false);
                // Refresh the subscription data
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const errorMessage =
                    response && typeof response === 'object' && 'message' in response
                        ? response.message
                        : 'Failed to cancel subscription. Please try again.';
                dispatch(
                    showToast({
                        variant: 'error',
                        description: errorMessage,
                    })
                );
            }
        } catch (err) {
            console.error('Error cancelling subscription:', err);
            dispatch(
                showToast({
                    variant: 'error',
                    description:
                        'An error occurred while cancelling the subscription. Please try again.',
                })
            );
        } finally {
            setIsCancelling(false);
        }
    }, [purchaseData, dispatch]);

    return (
        <>
            {}
            <Flex>
                <Typography.Text className="flex-shrink-0 text-lg font-medium sm:text-xl">
                    Manage Subscription
                </Typography.Text>
            </Flex>

            {!purchaseData ? (
                <Skeleton className="mt-5" />
            ) : (
                <PlanDetails
                    purchaseData={purchaseData?.currentSubscription}
                    isGroupSubscription={purchaseData?.isGroupSubscription}
                    count={Math.max(
                        (addonData?.maxLimit ?? 0) - (purchaseData?.addOns?.maxLimit ?? 0),
                        0
                    )}
                    onCancelPlan={
                        Number(purchaseData?.currentSubscription?.subscriptionAmountPaid) > 0
                            ? handleOpenCancelModal
                            : undefined
                    }
                    isLoading={isCancelling}
                />
            )}

            {purchaseData?.addOns && (
                <PlanDetails
                    purchaseData={purchaseData.addOns}
                    count={purchaseData.addOns?.maxLimit}
                />
            )}

            <>
                {addonData && (
                    <Flex vertical className="w-full mt-6 xl:w-2/3">
                        <Typography.Text className="font-medium " style={{ fontSize: '0.9rem' }}>
                            Number of Vehicles: {details?.fleetsUsed} Vehicles
                        </Typography.Text>

                        <Flex
                            align={md ? 'center' : 'self-start'}
                            gap={10}
                            className="flex-col w-full mt-2 align-middle md:flex-row"
                        >
                            <Progress
                                className="w-full mt-2 md:w-5/12"
                                percent={
                                    addonData?.maxLimit
                                        ? Math.min(
                                              100,
                                              Math.round(
                                                  ((details?.fleetsUsed ?? 0) /
                                                      addonData.maxLimit) *
                                                      100
                                              )
                                          )
                                        : 0
                                }
                                strokeColor="#05BE63"
                            />
                            <Typography.Text className="flex-wrap mt-2 text-xs sm:text-sm">
                                {addonData!.maxLimit - details?.fleetsUsed} Left of{' '}
                                {addonData?.maxLimit} Vehicles
                            </Typography.Text>
                        </Flex>
                        <Flex vertical className="w-full mt-6 xl:w-full">
                            <Typography.Text
                                className="font-medium "
                                style={{ fontSize: '0.9rem' }}
                            >
                                Number of Drivers: {details?.driversUsed} Drivers
                            </Typography.Text>

                            <Flex
                                align={md ? 'center' : 'self-start'}
                                gap={10}
                                className="flex-col w-full mt-2 align-middle md:flex-row"
                            >
                                <Progress
                                    className="w-full mt-2 md:w-5/12"
                                    percent={
                                        addonData?.maxLimit
                                            ? Math.min(
                                                  100,
                                                  Math.round(
                                                      ((details?.driversUsed ?? 0) /
                                                          addonData.maxLimit) *
                                                          100
                                                  )
                                              )
                                            : 0
                                    }
                                    strokeColor="#05BE63"
                                />
                                <Typography.Text className="flex-wrap mt-2 text-xs sm:text-sm">
                                    {addonData!.maxLimit - details?.driversUsed} Left of{' '}
                                    {addonData!.maxLimit} Drivers
                                </Typography.Text>
                            </Flex>

                            <>
                                <Typography.Text
                                    className="font-medium mt-7"
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    Manage Additional Vehicles and Drivers
                                </Typography.Text>

                                {canPurchaseAddon ? (
                                    <>
                                        <Flex vertical className="mt-6">
                                            <Typography.Text className="mt-2 text-xs sm:text-sm">
                                                Number of additinal Vehicles and Drivers
                                            </Typography.Text>
                                            <Flex className="overflow-hidden overflow-x-auto xs:flex-wrap">
                                            {denominations.map((fleet, index) => (
                                                <FleetTag
                                                    key={index}
                                                    count={fleet}
                                                    onClick={() => handleUpdateCount(fleet)}
                                                    selected={fleetCount === fleet}
                                                />
                                            ))}

                                                {fleetCount && fleetCount > 0 && (
                                                    <Typography.Text className="mt-2 text-xs sm:text-sm">
                                                        Total additional amount{' '}
                                                        <strong>
                                                            ₹{' '}
                                                            {formatNumberWithLocalString(
                                                                totalAmount
                                                            )}
                                                        </strong>{' '}
                                                        for {fleetCount}{' '}
                                                        {fleetCount > 1
                                                            ? 'Vehicles and Drivers'
                                                            : 'Vehicle and Driver'}
                                                    </Typography.Text>
                                                )}
                                            </Flex>
                                        </Flex>
                                        <Typography.Text className="pt-1 text-red-600">
                                            {error}
                                        </Typography.Text>

                                        <Flex className="w-full mt-4">
                                            <Alert
                                                message="Note: The additional vehicles and drivers purchased will expire in one month. Please ensure they are utilized before the expiration date."
                                                type="warning"
                                                showIcon
                                            />
                                        </Flex>

                                        <Button
                                            className="px-6 mt-6 w-fit"
                                            type="primary"
                                            onClick={handleUpgrade}
                                            danger
                                        >
                                            Continue
                                        </Button>
                                    </>
                                ) : (
                                    <Flex
                                        className="mt-4 px-4 py-3 rounded-lg border border-[#FFE0E0] border-solid bg-[#FFF7F7]"
                                        align="center"
                                    >
                                        <Typography.Text className="text-sm font-medium text-[#FF4F4F]">
                                            Purchase an individual or group subscription to buy
                                            additional vehicles and drivers.
                                        </Typography.Text>
                                    </Flex>
                                )}
                            </>
                        </Flex>
                    </Flex>
                )}
            </>
            {openConfirmationModal && (
                <Suspense fallback={<Skeleton />}>
                    <ConfirmationModal
                        isOpen={openConfirmationModal}
                        handleCancel={handleCancelModal}
                        title={`Are you sure you want to cancel your ${purchaseData?.currentSubscription?.billingType?.toUpperCase() === 'ANNUALLY' ? 'annual' : 'monthly'} subscription?`}
                        handleSubmit={handleCancelSubscription}
                        isLoading={isCancelling}
                    />
                </Suspense>
            )}
        </>
    );
};

export default ManageSubscription;
