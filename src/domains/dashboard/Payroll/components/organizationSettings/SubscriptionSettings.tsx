import React, { useState } from 'react';

import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Alert, Button, Flex, Form, Modal, Progress, Skeleton, Tooltip, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import TextInput from '@components/atomic/inputs/TextInput';
import { cancelSubscriptionPatch } from '@src/domains/dashboard/settings/api/subscription';
import dangerIcon from '@src/domains/dashboard/settings/assets/danger.svg';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { calculatePercentage } from '@utils/calculatePercentage';
import { formattedDateOnly } from '@utils/dateFormat';
import { packageAccessKeys } from '@utils/packageAccessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PlanDetails from './PlanDetails';
import { PLAN_DETAILS_SESSION_KEY } from '../../../plans/utils';
import useGetEmployeeCount from '../../hooks/dashboardHooks/useGetEmployeeCount';
import { addOnSchema } from '../../schema/subscription';

const SubscriptionSettings = () => {
    const { md } = useScreenSize();
    const [totalAmount, setTotalAmount] = useState(0);
    const { count, date } = useGetEmployeeCount();
    const { user } = useAppSelector(state => state.reducer.user);
    const dispatch = useAppDispatch();

    const {
        addonData,
        purchaseData,
        refresh,
        isLoading: addonLoading,
    } = useGetAddonDetails(accessKeys.payroll, packageAccessKeys.Payroll);
    // Free/Basic plans have no configured add-on unit price — the backend reports isAddonPurchaseAllowed=false,
    // so we disable the purchase control and prompt an upgrade instead of toasting on submit.
    const canPurchaseAddon = addonData?.isAddonPurchaseAllowed === true;
    const isAddonPending = addonLoading && !addonData;
    const navigate = useNavigate();

    // Cancel-addon UI state.
    // Rule: user can only cancel the Payroll addon if their current employee count fits within
    // the plan's free tier (e.g. Peko Free's 3-employee baseline). Otherwise the user is
    // "occupied" — those extra employees would lose payroll access at addon expiry, so we force
    // them to remove employees first.
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const activeAddon = purchaseData?.addOns;
    const addonIds = activeAddon?.subscriptionIds ?? [];
    const alreadyCancelled = !!activeAddon?.isCancelled;
    const freeBaseLimit = addonData?.freeBaseLimit ?? 0;
    const employeesOverFreeTier = Math.max(0, (count ?? 0) - freeBaseLimit);
    const canCancel = addonIds.length > 0 && !alreadyCancelled && employeesOverFreeTier === 0;
    const employeeWord = (n: number) => (n === 1 ? 'employee' : 'employees');
    let cancelDisabledReason = '';
    if (alreadyCancelled) {
        cancelDisabledReason =
            'This add-on is already cancelled — it will expire at the end of the current cycle.';
    } else if (addonIds.length === 0) {
        cancelDisabledReason = 'No active Payroll add-on to cancel.';
    } else if (employeesOverFreeTier > 0) {
        cancelDisabledReason = `You have ${count} ${employeeWord(count ?? 0)} but your plan only covers ${freeBaseLimit}. Remove the extra ${employeesOverFreeTier} ${employeeWord(employeesOverFreeTier)} first, then cancel the add-on.`;
    }

    const handleCancelAddon = async () => {
        if (!canCancel) return;
        setCancelLoading(true);
        try {
            // Each addon purchase is a separate Subscription row; cancel them all so renewal
            // stops across the whole bundle.
            const results = await Promise.all(addonIds.map(id => cancelSubscriptionPatch(id)));
            const failed = results.filter(r => !r);
            if (failed.length > 0) {
                dispatch(
                    showToast({
                        description: `Couldn't cancel ${failed.length} add-on row(s). Please try again.`,
                        variant: 'error',
                    })
                );
            } else {
                dispatch(
                    showToast({
                        description:
                            'Add-on cancelled. You can keep using your current employees until the end of the billing cycle.',
                        variant: 'success',
                    })
                );
                await refresh();
            }
        } catch (err) {
            dispatch(
                showToast({
                    description: 'Something went wrong. Please try again.',
                    variant: 'error',
                })
            );
        } finally {
            setCancelLoading(false);
            setCancelModalOpen(false);
        }
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
            {purchaseData?.addOns && (
                <PlanDetails
                    purchaseData={purchaseData.addOns}
                    rightSlot={
                        user?.roleName !== 'corporate sub user' && addonIds.length > 0 ? (
                            <Tooltip
                                title={!canCancel ? cancelDisabledReason : ''}
                                placement="topRight"
                            >
                                <span>
                                    <Button
                                        danger
                                        disabled={!canCancel}
                                        loading={cancelLoading}
                                        onClick={() => setCancelModalOpen(true)}
                                    >
                                        {alreadyCancelled ? 'Add-on cancelled' : 'Cancel'}
                                    </Button>
                                </span>
                            </Tooltip>
                        ) : null
                    }
                />
            )}
            {/* Cancelled add-on card — no Cancel button needed; the "Cancelled" status
                cell carries its own tooltip explaining that access continues until expiry. */}
            {purchaseData?.cancelledAddOns && (
                <PlanDetails purchaseData={purchaseData.cancelledAddOns} />
            )}
            <Flex vertical className="w-full mt-8">
                <Typography.Text className="font-medium " style={{ fontSize: '0.9rem' }}>
                    Number of added employees:{count} {count === 1 ? 'employee' : 'employees'}
                </Typography.Text>

                <Flex
                    align={md ? 'center' : 'self-start'}
                    gap={10}
                    className="flex-col w-full mt-2 align-middle items-center md:flex-row"
                >
                    <Progress
                        className="w-full mt-2 md:w-7/12 "
                        percent={calculatePercentage(count, addonData?.maxLimit)}
                        strokeColor="#05BE63"
                    />
                    <Typography.Text className="flex-wrap text-xs sm:text-sm">
                        {Number(addonData?.maxLimit) - Number(count) < 0
                            ? 0
                            : Number(addonData?.maxLimit) - Number(count)}{' '}
                        Left of {addonData?.maxLimit} Employees
                    </Typography.Text>
                </Flex>
                {date && (
                    <Typography.Text
                        className="font-medium text-gray-400"
                        style={{ fontSize: '0.9rem' }}
                    >
                        Last employee added on {formattedDateOnly(new Date(date!))}
                    </Typography.Text>
                )}
                {user?.roleName !== 'corporate sub user' && (
                    <>
                        <Typography.Text
                            className="font-medium mt-7"
                            style={{ fontSize: '0.9rem' }}
                        >
                            Manage Additional Employees
                        </Typography.Text>

                        {isAddonPending && <Skeleton className="mt-6" />}
                        {canPurchaseAddon && (
                            <Flex className="w-full mt-6 xl:w-2/3">
                                <Alert
                                    message={`Note: You will be charged ₹ ${formatNumberWithLocalString(addonData?.unitPrice)} for each new employee added.`}
                                    type="warning"
                                    showIcon
                                />
                            </Flex>
                        )}
                        {!isAddonPending && !canPurchaseAddon && (
                            <Flex
                                className="w-full mt-6 xl:w-2/3 px-4 py-3 rounded-lg border border-[#FFE0E0] border-solid bg-[#FFF7F7]"
                                align="center"
                            >
                                <Typography.Text className="text-sm font-medium text-[#FF4F4F]">
                                    Purchase an individual or group subscription to buy additional
                                    employees.
                                </Typography.Text>
                            </Flex>
                        )}
                        {canPurchaseAddon && (
                            <Flex className="mt-7">
                                <Formik
                                    initialValues={{ addonQuantity: '' }}
                                    onSubmit={values => {
                                        if (!canPurchaseAddon) {
                                            return;
                                        }
                                        const quantity = values.addonQuantity;
                                        const addOnpaymentPayload = {
                                            pgAmount: totalAmount,
                                            addonsAccessKey: accessKeys.payroll,
                                            packageId: addonData?.packageId,
                                            quantity,
                                            isDynamicUnitPricing:
                                                addonData?.isDynamicUnitPricing ?? false,
                                            title: 'Payroll',
                                            description: '',
                                            rows: [
                                                {
                                                    column1: 'Additional Employee',
                                                    column2: `${quantity} ${Number(quantity) === 1 ? 'Employee' : 'Employees'}`,
                                                    column3: `₹ ${formatNumberWithLocalString(totalAmount)}`,
                                                },
                                            ],
                                        };

                                        const hasMandate =
                                            !!purchaseData?.currentSubscription
                                                ?.vendorSubscriptionId;
                                        sessionStorage.setItem(
                                            PLAN_DETAILS_SESSION_KEY,
                                            JSON.stringify(
                                                hasMandate
                                                    ? {
                                                          url: window.location.href,
                                                          service: 'Payroll',
                                                          addOnpaymentPayload,
                                                          isAddOns: true,
                                                      }
                                                    : {
                                                          url: window.location.href,
                                                          service: 'isMandate',
                                                          planId: purchaseData?.currentSubscription
                                                              ?.package?.id,
                                                          selectedType: 'monthly',
                                                          isAddOns: false,
                                                          isMandate: true,
                                                          addOnpaymentPayload,
                                                      }
                                            )
                                        );
                                        navigate(
                                            `/${paths.plans.index}/${paths.plans.reviewOrder}`
                                        );
                                    }}
                                    validationSchema={addOnSchema}
                                >
                                    {({ handleSubmit, values }) => (
                                        <Form onFinish={handleSubmit} layout="vertical">
                                            <Flex align="center" vertical={!md}>
                                                <TextInput
                                                    type="text"
                                                    label="Number of additional employees"
                                                    name="addonQuantity"
                                                    allowNumbersOnly
                                                    classes="w-72"
                                                    handleChange={quantity =>
                                                        setTotalAmount(
                                                            Number(quantity) * addonData!.unitPrice
                                                        )
                                                    }
                                                    maxLength={6}
                                                />
                                            </Flex>
                                            {totalAmount ? (
                                                <Flex className="">
                                                    <Typography.Text className="pb-5 xs:px-0 md:pb-0 md:whitespace-nowrap text-black/70 w-full">
                                                        Total Additional Amount{' '}
                                                        <span className="font-medium text-black">
                                                            ₹{' '}
                                                            {formatNumberWithLocalString(
                                                                totalAmount
                                                            )}{' '}
                                                            for {values.addonQuantity}{' '}
                                                            {`${Number(values.addonQuantity) === 1 ? 'Employee' : 'Employees'}`}
                                                        </span>
                                                    </Typography.Text>
                                                </Flex>
                                            ) : (
                                                ''
                                            )}
                                            <Button
                                                className="px-12 mt-6"
                                                type="primary"
                                                danger
                                                htmlType="submit"
                                                disabled={!canPurchaseAddon}
                                            >
                                                Submit
                                            </Button>
                                        </Form>
                                    )}
                                </Formik>
                            </Flex>
                        )}
                    </>
                )}
            </Flex>
            <Modal
                open={cancelModalOpen}
                onCancel={() => setCancelModalOpen(false)}
                footer={null}
                closable={false}
                centered
                width="min(720px, calc(100vw - 32px))"
                destroyOnClose
                styles={{
                    body: { padding: 0 },
                    content: { padding: 0, borderRadius: 16, overflow: 'hidden' },
                }}
            >
                <Flex vertical>
                    <Flex
                        justify="space-between"
                        align="center"
                        className="px-5 sm:px-8 pt-5 sm:pt-7 pb-3 sm:pb-4"
                    >
                        <Flex align="center" gap={14} className="sm:!gap-[18px] flex-1 min-w-0">
                            <Flex
                                align="center"
                                justify="center"
                                className="hidden sm:flex w-16 h-16 rounded-full bg-iconBgRed flex-shrink-0"
                            >
                                <ReactSVG
                                    src={dangerIcon}
                                    className="flex items-center justify-center"
                                />
                            </Flex>
                            <Typography.Text className="text-lg sm:text-2xl font-semibold text-textBlack leading-6 sm:leading-8">
                                Cancel Payroll add-on?
                            </Typography.Text>
                        </Flex>
                        <Button
                            type="text"
                            icon={
                                <CloseOutlined className="text-textGreyColor text-lg sm:text-xl" />
                            }
                            onClick={() => setCancelModalOpen(false)}
                            aria-label="Close"
                            className="flex-shrink-0"
                        />
                    </Flex>

                    <Flex vertical className="px-5 sm:px-8 pb-5 sm:pb-7">
                        <Flex
                            gap={8}
                            align="start"
                            className="rounded-[10px] px-4 sm:px-[17px] py-4 bg-bgGrayF9 border border-solid border-borderGray"
                        >
                            <InfoCircleOutlined className="text-textBlack text-base flex-shrink-0 mt-1" />
                            <Typography.Text className="text-textBlack text-sm sm:text-base leading-[22px]">
                                {`You'll keep access to add-on employees until the end of current billing cycle. After that, only ${freeBaseLimit} ${employeeWord(freeBaseLimit)} seats will remain accessible as per the current plan. You can purchase the add-on any time.`}
                            </Typography.Text>
                        </Flex>
                    </Flex>

                    <Flex
                        gap={12}
                        className="px-5 sm:px-8 py-4 sm:py-5 sm:!gap-4 flex-col sm:flex-row bg-bgGrayF9 border-0 border-t border-solid border-skeltonGray"
                    >
                        <Button
                            block
                            size="large"
                            danger
                            onClick={() => setCancelModalOpen(false)}
                            disabled={cancelLoading}
                            className="h-[52px] text-base font-medium"
                        >
                            Keep add-on
                        </Button>
                        <Button
                            block
                            size="large"
                            type="primary"
                            danger
                            loading={cancelLoading}
                            onClick={handleCancelAddon}
                            className="h-[52px] text-base font-medium"
                        >
                            Yes, cancel add-on
                        </Button>
                    </Flex>
                </Flex>
            </Modal>
        </Content>
    );
};

export default SubscriptionSettings;
