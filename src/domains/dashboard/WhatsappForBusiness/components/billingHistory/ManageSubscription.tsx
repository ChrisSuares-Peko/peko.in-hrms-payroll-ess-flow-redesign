import React, { lazy, Suspense, useState } from 'react';

import { CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Typography, Row, Col, Tag, Button, Card, Flex, Skeleton } from 'antd';
import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import { calculateDiscount } from '@src/domains/dashboard/plans/utils';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly } from '@utils/dateFormat';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import AboutModal from './AboutModal';
import ShopifyAboutModal from './ShopifyAboutModal';
import ExclamationCircleOutlinedWarning from '../../assets/exclamation-circle-filled.svg';
import { useBotBuilderAmount } from '../../hooks/useBotBuilderAmount';
import useBotBuilderPayment from '../../hooks/useBotBuilderPayment';
import { useGenerateEmbeddedSignupURL } from '../../hooks/useGenerateEmbeddedSignupURL';
import { useGetActiveBotBuilder } from '../../hooks/useGetActiveBotBuilder';
import { useGetActiveShopifyIntegration } from '../../hooks/useGetActiveShopifyIntegration';
import { useGetActiveSubscription } from '../../hooks/useGetActiveSubscription';
import { useGetDetailsSubscription } from '../../hooks/useGetDetailsSubscription';
import { useReActivateBillingApi } from '../../hooks/useReActivateBilling';
import { useShopifyIntegrationAmount } from '../../hooks/useShopifyIntegrationAmount';
import useShopifyIntegrationPayment from '../../hooks/useShopifyIntegrationPayment';
import { useStopBillingApi } from '../../hooks/useStopBilling';
import { useStopBotBuilderApi } from '../../hooks/useStopBotBuilder';
import { useStopShopifyIntegrationApi } from '../../hooks/useStopShopifyIntegration';
import useWhatsAppSubscriptionPayment from '../../hooks/useSubscriptionPayment';
import { ActiveSubscriptionResponse, PackageDetails } from '../../types/types';

const CancelSubscriptionModal = lazy(
    () =>
        import(
            '@src/domains/dashboard/settings/components/subscription_plans/CancelSubscriptionModal'
        )
);

type ManageSubscriptionProps = {
    setRefresh: (value: boolean) => void;
};

const ManageSubscription: React.FC<ManageSubscriptionProps> = ({ setRefresh }) => {
    const serviceKey = packageAccessKeys['Whatsapp for Business'];
    const { data, isLoading, refresh } = useGetActiveSubscription(true);
    const dispatch = useAppDispatch();
    const {
        packages,
        deduction,
        isLoading: packageLoading,
    } = useGetDetailsSubscription({ accessKey: serviceKey });
    const {
        data: botbuilderData,
        isLoading: builderLoading,
        refresh: builderRefresh,
    } = useGetActiveBotBuilder(true);
    const { data: amountData, isLoading: Loading } = useBotBuilderAmount();
    const {
        data: shopifyIntegrationSubData,
        isLoading: shopifyBuilderLoading,
        refresh: shopifyBuilderRefresh,
    } = useGetActiveShopifyIntegration(true);
    const { data: shopifyAmountData, isLoading: shopifyLoading } = useShopifyIntegrationAmount();
    const { generateURL, isLoading: embeddedLoading } = useGenerateEmbeddedSignupURL();
    const { handleSubmission: handleSubscription } = useWhatsAppSubscriptionPayment();
    const { stopBilling, isLoading: isStopping } = useStopBillingApi();
    const { stopBotBuilder, isLoading: isBotStopping } = useStopBotBuilderApi();
    const { stopShopifyIntegration, isLoading: isShopifyStopping } = useStopShopifyIntegrationApi();
    const [loading, setLoading] = useState<boolean>(false);
    const [shopifyPurchaseLoading, setShopifyPurchaseLoading] = useState<boolean>(false);
    const { handleSubmission } = useBotBuilderPayment();
    const { handleSubmission: handleShopifySubmission } = useShopifyIntegrationPayment();
    const { reactivateBilling, isLoading: isReactivating } = useReActivateBillingApi();
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [openBotBuilderModal, setOpenBotBuilderModal] = useState(false);
    const [openShopifyIntegrationModal, setOpenShopifyIntegrationModal] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [botBuilderValue, setBotBuilderValue] = useState<number>(0);
    const [shopifyValue, setShopifyValue] = useState<number>(0);
    const [open, setOpen] = useState<boolean>(false);
    const [openShopify, setOpenShopify] = useState<boolean>(false);

    const handleStopBilling = async (subscriptionId: number) => {
        await stopBilling(subscriptionId);
        refresh();
        setRefresh(true);
        setOpenConfirmationModal(false);
    };
    const handleStopBotBuilder = async (subscriptionId: number) => {
        await stopBotBuilder(subscriptionId);
        builderRefresh();
        setRefresh(true);
        setOpenBotBuilderModal(false);
    };
    const handleStopShopifyIntegration = async (subscriptionId: number) => {
        await stopShopifyIntegration(subscriptionId);
        shopifyBuilderRefresh();
        setRefresh(true);
        setOpenShopifyIntegrationModal(false);
    };
    const navigate = useNavigate();

    const handleReactivateBilling = async (subscriptionId: number) => {
        await reactivateBilling(subscriptionId);
        refresh();
        setRefresh(true);
    };

    const handleCancelModal = () => {
        setOpenBotBuilderModal(false);
        setOpenConfirmationModal(false);
        setOpenShopifyIntegrationModal(false);
    };
    const handleOpen = () => {
        setOpen(true);
    };
    const handleOpenShopify = () => {
        setOpenShopify(true);
    };

    if (isLoading || isStopping || isReactivating) {
        return <Skeleton />;
    }
    const calculateProratedAmount = (
        subscriptionEndDate: any,
        amountDetails: any,
        billingType: string | undefined
    ) => {
        if (!subscriptionEndDate) return '-';

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight

        const subscriptionEnd = new Date(subscriptionEndDate);
        subscriptionEnd.setHours(0, 0, 0, 0);

        if (today > subscriptionEnd) return '-'; // If today is after the subscription period

        const diffInTime = subscriptionEnd.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffInTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days

        // Determine daily rate based on billing type
        const dailyRate =
            billingType === 'ANNUALLY'
                ? amountDetails.yearlyAmount / 365
                : amountDetails.amount / 30;

        const proratedAmount = daysLeft * dailyRate;

        return proratedAmount.toFixed(2);
    };
    const handlePuchase = async () => {
        setLoading(true);
        await handleSubmission(
            calculateProratedAmount(
                data?.activeSubscriptions?.subscriptionEndDate,
                amountData,
                data?.activeSubscriptions?.billingType
            ),
            data?.activeSubscriptions?.projectId!
        );
        setLoading(false);
    };

    const handlePurchaseShopify = async () => {
        setShopifyPurchaseLoading(true);
        await handleShopifySubmission(
            calculateProratedAmount(
                data?.activeSubscriptions?.subscriptionEndDate,
                shopifyAmountData,
                data?.activeSubscriptions?.billingType
            ),
            data?.activeSubscriptions?.projectId!
        );
        setShopifyPurchaseLoading(false);
    };

    const handlePurchaseClick = async (message: string) => {
        dispatch(
            showToast({
                description: message,
                variant: 'error',
            })
        );
    };

    const handleApplyNowClick = async (projectId: string) => {
        // setAccountStatusLoading(projectId);
        try {
            const response = await generateURL(projectId);
            if (response && response.embeddedSignupURL) {
                window.open(response.embeddedSignupURL, '_blank');
            } else {
                console.error('Embedded signup URL is missing.');
            }
        } catch (error) {
            console.error('Error generating URL:', error);
        }
    };

    const getStatusClassName = (status: string) => {
        if (status === 'ACTIVE' || status === 'PENDING') {
            return 'bg-[#B8FF8C] text-[#363835]';
        }
        if (status === 'EXPIRED') {
            return 'bg-[#E63636] text-white';
        }
        return 'bg-[#E63636] text-[#363835]';
    };

    const handlePurchasePlan = async () => {
        setButtonLoading(true);

        const packageId = data?.activeSubscriptions?.package?.id;
        const billingType = data?.activeSubscriptions?.billingType?.toLowerCase() as
            | 'monthly'
            | 'annually';

        const selectedPackage = packages?.find(pkg => pkg.id === packageId);
        if (!selectedPackage || !billingType || !selectedPackage.packagePrices[billingType]) {
            setButtonLoading(false);
            return;
        }

        // Get the subscription price and discount based on the billing plan
        const subscriptionPrice =
            parseFloat(selectedPackage.packagePrices[billingType].toString()) || 0;
        const discount = parseFloat(selectedPackage.discount[billingType].toString()) || 0;

        // Calculate the discounted amount
        const { discountedAmount } = calculateDiscount(subscriptionPrice, discount);

        const details = {
            url: `${paths.dashboard.moreServices}/${paths.whatsappForBusiness.index}`,
            service: 'WhatsApp For Business',
        };

        sessionStorage.setItem('PurchaseUrl', JSON.stringify(details));

        let updatedBotBuilderValue = botBuilderValue;

        if (botBuilderValue === 0 && botbuilderData?.activeSubscriptions && amountData) {
            if (botbuilderData?.activeSubscriptions?.billingType === 'MONTHLY') {
                updatedBotBuilderValue = amountData.amount;
            } else {
                updatedBotBuilderValue = amountData.yearlyAmount;
            }
            setBotBuilderValue(updatedBotBuilderValue);
        }

        let updatedShopifyValue = shopifyValue;

        if (
            shopifyValue === 0 &&
            shopifyIntegrationSubData?.activeSubscriptions &&
            shopifyAmountData
        ) {
            if (shopifyIntegrationSubData?.activeSubscriptions?.billingType === 'MONTHLY') {
                updatedShopifyValue = shopifyAmountData.amount;
            } else {
                updatedShopifyValue = shopifyAmountData.yearlyAmount;
            }
            setShopifyValue(updatedShopifyValue);
        }

        await handleSubscription(
            data?.activeSubscriptions?.billingPlan!,
            data?.activeSubscriptions?.billingType!,
            data?.activeSubscriptions?.package?.id!,
            discountedAmount,
            updatedBotBuilderValue,
            data?.activeSubscriptions,
            deduction!,
            true,
            updatedShopifyValue
        );

        setButtonLoading(false);
    };

    if (
        isLoading ||
        Loading ||
        builderLoading ||
        packageLoading ||
        shopifyBuilderLoading ||
        shopifyLoading
    ) {
        return <Skeleton />;
    }

    function getSubscriptionPrice(
        subscriptiondata: ActiveSubscriptionResponse,
        datapackages: PackageDetails[]
    ) {
        const packageId = subscriptiondata?.activeSubscriptions?.package?.id;
        const billingType = subscriptiondata?.activeSubscriptions?.billingType?.toLowerCase();

        if (!billingType || (billingType !== 'monthly' && billingType !== 'annually')) {
            return 0;
        }

        const selectedPackage = datapackages?.find(pkg => pkg.id === packageId);
        if (!selectedPackage || !selectedPackage.packagePrices[billingType]) {
            return 0;
        }
        return parseFloat(selectedPackage.packagePrices[billingType].toString()) || 0;
    }

    const isBundledPlan =
        !data?.activeSubscriptions?.subscriptionPaymentRefId &&
        (data?.activeSubscriptions?.billingPlan ?? '').toUpperCase() === 'BASIC' &&
        !data?.activeSubscriptions?.isCustom;

    let totalAmountDisplay = '-';
    if (isBundledPlan) {
        totalAmountDisplay = 'Free';
    } else if (data?.activeSubscriptions?.subscriptionAmountPaid) {
        totalAmountDisplay = `₹ ${Number(getSubscriptionPrice(data, packages!)).toFixed(2)}`;
    }

    return (
        <Flex vertical gap={20}>
            <Card style={{ borderRadius: '12px', padding: '20px' }}>
                <Flex vertical gap={15}>
                    <Row justify="space-between" align="middle" gutter={[20, 20]}>
                        <Col>
                            <Flex className="flex items-center justify-center w-full xl:justify-start xl:items-start">
                                <Typography.Text
                                    className="font-medium text-center "
                                    style={{ marginBottom: 0, fontSize: '20px' }}
                                >
                                    Whatsapp for Business -{' '}
                                    {capitalize(data?.activeSubscriptions?.billingPlan) || '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                    </Row>

                    <Row justify="space-between" align="middle" gutter={[20, 20]}>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Total Amount
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {totalAmountDisplay}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical align="start">
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Status
                                </Typography.Text>
                                <Tag
                                    className={` rounded-2xl mt-1 border-0 px-3 py-0.5 ${
                                        data?.activeSubscriptions?.status === 'ACTIVE' ||
                                        data?.activeSubscriptions?.status === 'PENDING'
                                            ? 'bg-[#B8FF8C] text-[#363835]'
                                            : 'bg-[#E63636] text-white'
                                    }`}
                                >
                                    {(() => {
                                        const status = data?.activeSubscriptions?.status;
                                        if (status === 'PENDING') {
                                            return 'Purchased';
                                        }
                                        if (status) {
                                            return capitalize(status);
                                        }
                                        return '-';
                                    })()}
                                </Tag>
                            </Flex>
                        </Col>

                        <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Plan Started
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {data?.activeSubscriptions?.subscriptionStartDate
                                        ? formattedDateOnly(
                                              new Date(
                                                  data?.activeSubscriptions?.subscriptionStartDate
                                              )
                                          )
                                        : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Valid Until
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {data?.activeSubscriptions?.subscriptionEndDate
                                        ? formattedDateOnly(
                                              new Date(
                                                  data?.activeSubscriptions?.subscriptionEndDate
                                              )
                                          )
                                        : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Billed
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {capitalize(data?.activeSubscriptions?.billingType) || '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        {/* <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Payment Mode
                                </Typography.Text>
                                <Typography.Text className="mt-1">Card - Auto</Typography.Text>
                            </Flex>
                        </Col> */}
                        <Col xs={24} sm={24} md={24} lg={24} xl={3}>
                            <Flex vertical justify="center" gap={10} align="center">
                                {data?.activeSubscriptions?.projectId &&
                                    (() => {
                                        const { status, isCancelled, id } =
                                            data.activeSubscriptions;
                                        if (!isBundledPlan && isCancelled) {
                                            return (
                                                <Flex onClick={() => handleReactivateBilling(id!)}>
                                                    <Typography.Text className="cursor-pointer text-lightRed text-nowrap">
                                                        <CloseCircleOutlined className="text-green-500 pe-2" />
                                                        Re Activate plan
                                                    </Typography.Text>
                                                </Flex>
                                            );
                                        }
                                        if (!isCancelled && status !== 'PENDING') {
                                            return (
                                                <Flex vertical gap={15}>
                                                    {!(
                                                        data?.activeSubscriptions?.billingType ===
                                                            'ANNUALLY' &&
                                                        data?.activeSubscriptions?.billingPlan ===
                                                            'PRO'
                                                    ) && (
                                                        <Button
                                                            loading={isLoading}
                                                            danger
                                                            className="flex items-center justify-center "
                                                            onClick={() => {
                                                                navigate(
                                                                    `/${paths.whatsappForBusiness.index}/${paths.whatsappForBusiness.planDetails}`
                                                                );
                                                            }}
                                                        >
                                                            Upgrade Plan
                                                        </Button>
                                                    )}

                                                    {status === 'EXPIRED' && (
                                                        <Button
                                                            loading={buttonLoading}
                                                            danger
                                                            type="primary"
                                                            className="flex items-center justify-center "
                                                            onClick={handlePurchasePlan}
                                                        >
                                                            Pay Now
                                                        </Button>
                                                    )}
                                                    {status !== 'EXPIRED' && !isBundledPlan && (
                                                        <Flex
                                                            onClick={() =>
                                                                setOpenConfirmationModal(true)
                                                            }
                                                        >
                                                            <Typography.Text className="text-red-700 cursor-pointer text-nowrap">
                                                                <CloseCircleOutlined className="pe-2" />
                                                                Cancel my plan
                                                            </Typography.Text>
                                                        </Flex>
                                                    )}
                                                </Flex>
                                            );
                                        }
                                        return null;
                                    })()}
                            </Flex>
                        </Col>
                    </Row>
                    {data?.activeSubscriptions?.status === 'EXPIRED' && (
                        <Typography.Text className="text-[#F74C4C]">
                            Your last payment failed after multiple attempts. We have restricted
                            your usage for this service, please pay now to continue.
                        </Typography.Text>
                    )}
                    {data?.activeSubscriptions?.status === 'PENDING' && (
                        <Flex gap={10} align="center">
                            <Typography.Text className="text-[#F74C4C]">
                                Your plan has not been started. Please verify your WABA account to
                                start your plan.
                            </Typography.Text>
                            <Button
                                danger
                                size="small"
                                className="text-xs"
                                onClick={() =>
                                    handleApplyNowClick(
                                        data?.activeSubscriptions?.projectId
                                            ? data?.activeSubscriptions?.projectId
                                            : ''
                                    )
                                }
                                loading={embeddedLoading}
                            >
                                Verify
                            </Button>
                        </Flex>
                    )}
                </Flex>
            </Card>
            <Flex>
                <Typography.Text className="text-sm font-semibold text-center ms-2">
                    Add on
                </Typography.Text>
            </Flex>
            <Card style={{ borderRadius: '12px', padding: '20px' }}>
                <Flex vertical gap={15}>
                    <Row justify="space-between" align="middle" gutter={[20, 20]}>
                        <Col>
                            <Flex className="flex items-center justify-center w-full xl:justify-start xl:items-start">
                                <Typography.Text
                                    className="font-medium"
                                    style={{ marginBottom: 0, fontSize: '20px' }}
                                >
                                    Enable flow builder
                                </Typography.Text>
                            </Flex>
                        </Col>
                    </Row>

                    <Row justify="space-between" align="middle" gutter={[20, 20]}>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Total Amount
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {botbuilderData?.activeSubscriptions?.isCustom
                                        ? `₹ ${Number(botbuilderData.activeSubscriptions.subscriptionAmountPaid).toFixed(2)}`
                                        : `₹ ${
                                              data?.activeSubscriptions?.billingType === 'ANNUALLY'
                                                  ? Number(amountData?.yearlyAmount).toFixed(2)
                                                  : Number(amountData?.amount).toFixed(2)
                                          }`}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical align="start">
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Status
                                </Typography.Text>
                                <Typography.Text>
                                    {botbuilderData?.activeSubscriptions ? (
                                        <Tag
                                            className={` rounded-2xl mt-1 border-0 px-3 py-0.5 ${getStatusClassName(
                                                botbuilderData?.activeSubscriptions?.status!
                                            )}`}
                                        >
                                            {(() => {
                                                const status =
                                                    botbuilderData?.activeSubscriptions?.status;
                                                if (status === 'PENDING') {
                                                    return 'Purchased';
                                                }
                                                if (status) {
                                                    return capitalize(status);
                                                }
                                                return '-';
                                            })()}
                                        </Tag>
                                    ) : (
                                        '-'
                                    )}
                                </Typography.Text>
                            </Flex>
                        </Col>

                        <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Plan Started
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {botbuilderData?.activeSubscriptions?.subscriptionStartDate
                                        ? formattedDateOnly(
                                              new Date(
                                                  botbuilderData?.activeSubscriptions?.subscriptionStartDate
                                              )
                                          )
                                        : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Valid Until
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {botbuilderData?.activeSubscriptions?.subscriptionEndDate
                                        ? formattedDateOnly(
                                              new Date(
                                                  botbuilderData?.activeSubscriptions?.subscriptionEndDate
                                              )
                                          )
                                        : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Billed
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {capitalize(botbuilderData?.activeSubscriptions?.billingType) ||
                                        '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Payment Mode
                                </Typography.Text>
                                <Typography.Text className="mt-1">Card - Auto</Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24} xl={3}>
                            <Flex vertical>
                                <Flex vertical align="center" gap={15}>
                                    {data?.activeSubscriptions?.status === 'ACTIVE' &&
                                        (!botbuilderData?.activeSubscriptions?.status ||
                                            (botbuilderData?.activeSubscriptions?.status !==
                                                'ACTIVE' &&
                                                botbuilderData?.activeSubscriptions?.status !==
                                                    'EXPIRED')) && (
                                            <Button
                                                danger
                                                className="flex items-center justify-center -ml-2"
                                                onClick={handlePuchase}
                                                loading={loading}
                                            >
                                                Purchase Now
                                            </Button>
                                        )}
                                    {!botbuilderData?.activeSubscriptions &&
                                        (data?.activeSubscriptions?.status === 'PENDING' ||
                                            data?.activeSubscriptions?.status === 'EXPIRED') && (
                                            <Button
                                                danger
                                                className="flex items-center justify-center -ml-2"
                                                onClick={() =>
                                                    handlePurchaseClick(
                                                        data?.activeSubscriptions?.status ===
                                                            'PENDING'
                                                            ? 'Please verify your WhatsApp Business Account first to purchase the add-on.'
                                                            : 'Please make the payment for the plan before you can purchase the add-on.'
                                                    )
                                                }
                                            >
                                                Purchase Now
                                            </Button>
                                        )}
                                    {(botbuilderData?.activeSubscriptions?.isCancelled && (
                                        <Typography.Text className="text-center text-red-700 cursor-default">
                                            Cancellation effective on{' '}
                                            {formattedDateOnly(
                                                new Date(
                                                    botbuilderData.activeSubscriptions.subscriptionEndDate
                                                )
                                            )}
                                        </Typography.Text>
                                    )) ||
                                        null}
                                    {botbuilderData?.activeSubscriptions?.status === 'ACTIVE' &&
                                        !botbuilderData?.activeSubscriptions?.isCancelled && (
                                            <Flex onClick={() => setOpenBotBuilderModal(true)}>
                                                <Typography.Text className="text-red-700 cursor-pointer text-nowrap">
                                                    <CloseCircleOutlined className="pe-2" />
                                                    Cancel my plan
                                                </Typography.Text>
                                            </Flex>
                                        )}

                                    <Flex
                                        align="center"
                                        className="ml-2 cursor-pointer"
                                        onClick={handleOpen}
                                    >
                                        <QuestionCircleOutlined />

                                        <Typography.Text className="ml-1 text-textLightRed text-nowrap">
                                            What is it
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Col>
                    </Row>
                    {botbuilderData?.activeSubscriptions &&
                        data?.activeSubscriptions?.status === 'EXPIRED' && (
                            <Flex
                                className="p-2.5 flex gap-1 items-center text-xs w-full"
                                style={{
                                    border: '#FFFCEC',
                                    textAlign: 'center',
                                }}
                            >
                                <ReactSVG src={ExclamationCircleOutlinedWarning} />
                                <Typography.Text className="text-gray-500">
                                    Your Add-on subscription has been expired as your Basic plan has
                                    not been renewed.
                                </Typography.Text>
                            </Flex>
                        )}
                </Flex>
            </Card>
            <Card style={{ borderRadius: '12px', padding: '20px' }}>
                <Flex vertical gap={15}>
                    <Row justify="space-between" align="middle" gutter={[20, 20]}>
                        <Col>
                            <Flex className="flex items-center justify-center w-full xl:justify-start xl:items-start">
                                <Typography.Text
                                    className="font-medium"
                                    style={{ marginBottom: 0, fontSize: '20px' }}
                                >
                                    Shopify Integration
                                </Typography.Text>
                            </Flex>
                        </Col>
                    </Row>

                    <Row justify="space-between" align="middle" gutter={[20, 20]}>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Total Amount
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {shopifyIntegrationSubData?.activeSubscriptions?.isCustom
                                        ? `₹ ${Number(shopifyIntegrationSubData.activeSubscriptions.subscriptionAmountPaid).toFixed(2)}`
                                        : `₹ ${
                                              data?.activeSubscriptions?.billingType === 'ANNUALLY'
                                                  ? Number(shopifyAmountData?.yearlyAmount).toFixed(
                                                        2
                                                    )
                                                  : Number(shopifyAmountData?.amount).toFixed(2)
                                          }`}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical align="start">
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Status
                                </Typography.Text>
                                <Typography.Text>
                                    {shopifyIntegrationSubData?.activeSubscriptions ? (
                                        <Tag
                                            className={` rounded-2xl mt-1 border-0 px-3 py-0.5 ${getStatusClassName(
                                                shopifyIntegrationSubData?.activeSubscriptions
                                                    ?.status!
                                            )}`}
                                        >
                                            {(() => {
                                                const status =
                                                    shopifyIntegrationSubData?.activeSubscriptions
                                                        ?.status;
                                                if (status === 'PENDING') {
                                                    return 'Purchased';
                                                }
                                                if (status) {
                                                    return capitalize(status);
                                                }
                                                return '-';
                                            })()}
                                        </Tag>
                                    ) : (
                                        '-'
                                    )}
                                </Typography.Text>
                            </Flex>
                        </Col>

                        <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Plan Started
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {shopifyIntegrationSubData?.activeSubscriptions
                                        ?.subscriptionStartDate
                                        ? formattedDateOnly(
                                              new Date(
                                                  shopifyIntegrationSubData?.activeSubscriptions?.subscriptionStartDate
                                              )
                                          )
                                        : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={4}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Valid Until
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {shopifyIntegrationSubData?.activeSubscriptions
                                        ?.subscriptionEndDate
                                        ? formattedDateOnly(
                                              new Date(
                                                  shopifyIntegrationSubData?.activeSubscriptions?.subscriptionEndDate
                                              )
                                          )
                                        : '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Billed
                                </Typography.Text>
                                <Typography.Text className="mt-1">
                                    {capitalize(
                                        shopifyIntegrationSubData?.activeSubscriptions?.billingType
                                    ) || '-'}
                                </Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={8} xl={3}>
                            <Flex vertical>
                                <Typography.Text
                                    className="text-[#8B8B8B]"
                                    style={{ fontSize: '14px' }}
                                >
                                    Payment Mode
                                </Typography.Text>
                                <Typography.Text className="mt-1">Card - Auto</Typography.Text>
                            </Flex>
                        </Col>
                        <Col xs={24} sm={24} md={24} lg={24} xl={3}>
                            <Flex vertical>
                                <Flex vertical align="center" gap={15}>
                                    {data?.activeSubscriptions?.status === 'ACTIVE' &&
                                        (!shopifyIntegrationSubData?.activeSubscriptions?.status ||
                                            (shopifyIntegrationSubData?.activeSubscriptions
                                                ?.status !== 'ACTIVE' &&
                                                shopifyIntegrationSubData?.activeSubscriptions
                                                    ?.status !== 'EXPIRED')) && (
                                            <Button
                                                danger
                                                className="flex items-center justify-center -ml-2"
                                                onClick={handlePurchaseShopify}
                                                loading={shopifyPurchaseLoading}
                                            >
                                                Purchase Now
                                            </Button>
                                        )}
                                    {!shopifyIntegrationSubData?.activeSubscriptions &&
                                        (data?.activeSubscriptions?.status === 'PENDING' ||
                                            data?.activeSubscriptions?.status === 'EXPIRED') && (
                                            <Button
                                                danger
                                                className="flex items-center justify-center -ml-2"
                                                onClick={() =>
                                                    handlePurchaseClick(
                                                        data?.activeSubscriptions?.status ===
                                                            'PENDING'
                                                            ? 'Please verify your WhatsApp Business Account first to purchase the add-on.'
                                                            : 'Please make the payment for the plan before you can purchase the add-on.'
                                                    )
                                                }
                                            >
                                                Purchase Now
                                            </Button>
                                        )}
                                    {(shopifyIntegrationSubData?.activeSubscriptions
                                        ?.isCancelled && (
                                        <Typography.Text className="text-center text-red-700 cursor-default">
                                            Cancellation effective on{' '}
                                            {formattedDateOnly(
                                                new Date(
                                                    shopifyIntegrationSubData.activeSubscriptions.subscriptionEndDate
                                                )
                                            )}
                                        </Typography.Text>
                                    )) ||
                                        null}
                                    {shopifyIntegrationSubData?.activeSubscriptions?.status ===
                                        'ACTIVE' &&
                                        !shopifyIntegrationSubData?.activeSubscriptions
                                            ?.isCancelled && (
                                            <Flex
                                                onClick={() => setOpenShopifyIntegrationModal(true)}
                                            >
                                                <Typography.Text className="text-red-700 cursor-pointer text-nowrap">
                                                    <CloseCircleOutlined className="pe-2" />
                                                    Cancel my plan
                                                </Typography.Text>
                                            </Flex>
                                        )}

                                    <Flex
                                        align="center"
                                        className="ml-2 cursor-pointer"
                                        onClick={handleOpenShopify}
                                    >
                                        <QuestionCircleOutlined />

                                        <Typography.Text className="ml-1 text-textLightRed text-nowrap">
                                            What is it
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            </Flex>
                        </Col>
                    </Row>
                    {shopifyIntegrationSubData?.activeSubscriptions &&
                        data?.activeSubscriptions?.status === 'EXPIRED' && (
                            <Flex
                                className="p-2.5 flex gap-1 items-center text-xs w-full"
                                style={{
                                    border: '#FFFCEC',
                                    textAlign: 'center',
                                }}
                            >
                                <ReactSVG src={ExclamationCircleOutlinedWarning} />
                                <Typography.Text className="text-gray-500">
                                    Your Add-on subscription has been expired as your Basic plan has
                                    not been renewed.
                                </Typography.Text>
                            </Flex>
                        )}
                </Flex>
            </Card>
            <Suspense>
                <CancelSubscriptionModal
                    isOpen={openConfirmationModal}
                    handleCancel={handleCancelModal}
                    handleSubmit={() => handleStopBilling(data?.activeSubscriptions.id!)}
                    isLoading={!!isStopping}
                    packageName={data?.activeSubscriptions?.package?.packageName ?? 'WhatsApp'}
                    employeeCount={0}
                    showPayrollWarning={false}
                    accessEndDate={
                        data?.activeSubscriptions?.subscriptionEndDate
                            ? new Date(data.activeSubscriptions.subscriptionEndDate)
                            : null
                    }
                    description="Please note: Cancelling will also remove your add-ons, if any. However, you can continue using the service and any associated add-ons until the end of your current billing cycle."
                />
            </Suspense>
            <Suspense>
                <CancelSubscriptionModal
                    isOpen={openBotBuilderModal}
                    handleCancel={handleCancelModal}
                    handleSubmit={() =>
                        handleStopBotBuilder(botbuilderData?.activeSubscriptions.id!)
                    }
                    isLoading={!!isBotStopping}
                    packageName="Bot Builder"
                    employeeCount={0}
                    showPayrollWarning={false}
                    accessEndDate={
                        botbuilderData?.activeSubscriptions?.subscriptionEndDate
                            ? new Date(botbuilderData.activeSubscriptions.subscriptionEndDate)
                            : null
                    }
                    description="Note: You will still be able to use the service until the end of your current billing cycle."
                />
            </Suspense>
            <Suspense>
                <CancelSubscriptionModal
                    isOpen={openShopifyIntegrationModal}
                    handleCancel={handleCancelModal}
                    handleSubmit={() =>
                        handleStopShopifyIntegration(
                            shopifyIntegrationSubData?.activeSubscriptions.id!
                        )
                    }
                    isLoading={!!isShopifyStopping}
                    packageName="Shopify Integration"
                    employeeCount={0}
                    showPayrollWarning={false}
                    accessEndDate={
                        shopifyIntegrationSubData?.activeSubscriptions?.subscriptionEndDate
                            ? new Date(
                                  shopifyIntegrationSubData.activeSubscriptions.subscriptionEndDate
                              )
                            : null
                    }
                    description="Note: You will still be able to use the service until the end of your current billing cycle."
                />
            </Suspense>
            {open && <AboutModal handleCancel={() => setOpen(false)} open={open} />}
            {openShopify && (
                <ShopifyAboutModal handleCancel={() => setOpenShopify(false)} open={openShopify} />
            )}
        </Flex>
    );
};

export default ManageSubscription;
