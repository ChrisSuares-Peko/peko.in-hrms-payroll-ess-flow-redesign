/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';

import { Alert, Button, Col, Flex, Form, Skeleton, Typography } from 'antd';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import SelectInput from '@components/atomic/inputs/SelectInput';
import ExclamationCircleOutlined from '@domains/dashboard/PekoCloud/assets/icons/exclamation-circle-filled.svg';
import { useAppSelector } from '@src/hooks/store';
import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PlanDetails from './PlanDetails';
import UsageBar from './UsageBar';
import { addOnSchema } from '../../schema';

const PlanCard = () => {
    const [totalAmount, setTotalAmount] = useState(0);
    const { user } = useAppSelector(state => state.reducer.user);

    const navigate = useNavigate();
    const { addonData, isLoading, purchaseData } = useGetAddonDetails(
        accessKeys.pekoCloud,
        packageAccessKeys.Hub
    );
    const canPurchaseAddon = addonData?.isAddonPurchaseAllowed === true;
    return (
        <>
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
                    purchaseData={{
                        ...purchaseData.addOns,
                        subscriptionEndDate:
                            purchaseData.addOns.subscriptionEndDate ??
                            purchaseData.currentSubscription?.subscriptionEndDate,
                    }}
                />
            )}
            <UsageBar />
            {user?.roleName !== 'corporate sub user' && (
                <Col className="mt-10">
                    <Flex className="w-fit" justify="center" gap="middle" vertical>
                        <Typography.Text className="text-lg font-medium">
                            Get Additional Storage
                        </Typography.Text>
                        {canPurchaseAddon && (
                            <Typography.Text
                                className="p-2.5 flex gap-1 text-sm"
                                style={{
                                    border: '#FFFCEC',
                                    textAlign: 'center',
                                    backgroundColor: '#FFFCEC',
                                }}
                            >
                                <ReactSVG src={ExclamationCircleOutlined} />
                                Note: Pay ₹ {formatNumberWithLocalString(addonData?.unitPrice)}
                                /month for every 1 GB additional storage
                            </Typography.Text>
                        )}
                    </Flex>
                    {isLoading ? (
                        <Skeleton />
                    ) : !canPurchaseAddon ? (
                        <Flex
                            className="w-full mt-6 xl:w-2/3 px-4 py-3 rounded-lg border border-[#FFE0E0] border-solid bg-[#FFF7F7]"
                            align="center"
                        >
                            <Typography.Text className="text-sm font-medium text-[#FF4F4F]">
                                Purchase an individual or group subscription to buy additional
                                storage.
                            </Typography.Text>
                        </Flex>
                    ) : purchaseData?.currentSubscription?.vendorSubscriptionId ? (
                        /* ── Mandate exists: show existing addon purchase form ── */
                        <Flex className="mt-5 " gap="middle" align="center">
                            <Col className="w-[360px] h-36 ">
                                <Formik
                                    initialValues={{ addonQuantity: '' }}
                                    onSubmit={values => {
                                        const quantity = values.addonQuantity;
                                        const addOnpaymentPayload = {
                                            pgAmount: totalAmount,
                                            addonsAccessKey: accessKeys.pekoCloud,
                                            packageId: addonData?.packageId,
                                            quantity,
                                            isDynamicUnitPricing:
                                                addonData?.isDynamicUnitPricing ?? false,
                                            title: 'Hub',
                                            description: '',
                                            rows: [
                                                {
                                                    column1: 'Additional Memory',
                                                    column2: `${quantity} GB`,
                                                    column3: `₹ ${formatNumberWithLocalString(totalAmount)} Monthly`,
                                                },
                                            ],
                                        };

                                        const currentPageUrl = window.location.href;
                                        sessionStorage.setItem(
                                            'PlanDetails',
                                            JSON.stringify({
                                                url: currentPageUrl,
                                                service: 'Cloud',
                                                addOnpaymentPayload,
                                                isAddOns: true,
                                            })
                                        );

                                        navigate(
                                            `/${paths.plans.index}/${paths.plans.reviewOrder}`
                                        );
                                    }}
                                    validationSchema={addOnSchema}
                                >
                                    {({ handleSubmit }) => (
                                        <Form
                                            onFinish={handleSubmit}
                                            layout="vertical"
                                            className="w-full"
                                        >
                                            <SelectInput
                                                name="addonQuantity"
                                                options={[
                                                    { label: '1 GB', value: 1 },
                                                    { label: '2 GB', value: 2 },
                                                    { label: '3 GB', value: 3 },
                                                    { label: '4 GB', value: 4 },
                                                    { label: '5 GB', value: 5 },
                                                    { label: '6 GB', value: 6 },
                                                    { label: '7 GB', value: 7 },
                                                    { label: '8 GB', value: 8 },
                                                ]}
                                                placeholder="Select additional storage"
                                                label="Choose Storage"
                                                showToolTip
                                                tooltipText="Select the additional storage you need to purchase"
                                                handleChange={quantity =>
                                                    setTotalAmount(
                                                        Number(quantity) * addonData!.unitPrice
                                                    )
                                                }
                                            />
                                            <Button
                                                className="px-10 mt-1.5"
                                                type="primary"
                                                htmlType="submit"
                                                danger
                                            >
                                                Submit
                                            </Button>
                                        </Form>
                                    )}
                                </Formik>
                            </Col>
                            {totalAmount ? (
                                <Col className="pt-10 h-36">
                                    <Typography.Text className="whitespace-nowrap text-black/70 mb-44">
                                        Total additional amount{' '}
                                        <span className="font-medium text-black">
                                            ₹ {formatNumberWithLocalString(totalAmount)}
                                        </span>
                                    </Typography.Text>
                                </Col>
                            ) : (
                                ''
                            )}
                        </Flex>
                    ) : (
                        /* ── No mandate: prompt to set up on-demand subscription ── */
                        <Flex className="w-full mt-6 xl:w-2/3">
                            <Alert
                                message="An on-demand subscription is required to manage additional storage. Set one up to enable automatic billing."
                                type="info"
                                showIcon
                                action={
                                    <Button
                                        danger
                                        size="small"
                                        disabled={!addonData?.packageId}
                                        onClick={() => {
                                            sessionStorage.setItem(
                                                'PlanDetails',
                                                JSON.stringify({
                                                    url: window.location.href,
                                                    service: 'Cloud',
                                                    planId: addonData?.packageId,
                                                    selectedType: 'monthly',
                                                    isAddOns: false,
                                                })
                                            );
                                            navigate(
                                                `/${paths.plans.index}/${paths.plans.reviewOrder}`
                                            );
                                        }}
                                    >
                                        Set Up On-Demand Subscription
                                    </Button>
                                }
                            />
                        </Flex>
                    )}
                </Col>
            )}
        </>
    );
};
export default PlanCard;
