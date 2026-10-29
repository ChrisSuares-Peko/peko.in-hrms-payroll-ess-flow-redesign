import React, { useEffect, useState } from 'react';

import { InfoCircleOutlined, LockOutlined } from '@ant-design/icons';
import { Flex, Typography, Skeleton, Button, Divider, Tooltip } from 'antd';
import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';

import cardLogo from '@assets/images/cashfreeLogo.png';
import { FRONTEND_BASE_URL } from '@src/config-global';
import useScreenSize from '@src/hooks/useScreenSize';
import useSubscriptionCodes from '@src/hooks/useSubscriptionVoucherCode';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import EnterCouponCode from './EnterCouponCode';
import SubscriptionVoucher from './EnterVoucherCode';
import voucher from '../../../assets/voucher.png';
import useApplyCoupon from '../../../hooks/useApplyCoupon';
import useGetPackageDetails from '../../../hooks/useGetPackageDetails';
import useGetPackages from '../../../hooks/useGetPackages';
import usePaymentRequest from '../../../hooks/usePaymentRequset';
import { SelectedType, SubscriptionPaymentMode } from '../../../types';
import { formatTaxLabel, getWhatsAppPlanDescription } from '../../../utils';
import { BoldText, GrayText } from '../../CustomText';
import { PlanInfoCard } from '../../review-order-card';

type Props = {
    selectedType: SelectedType;
    planId: number;
    isMandate?: boolean;
};

const PlanDetailsCard = ({ planId, selectedType, isMandate }: Props) => {
    const [totalPackagePrice, setTotalPackagePrice] = useState(0);
    const [finalPayableAmount, setFinalPayableAmount] = useState(0);
    // One-time vs auto-renew — offered for annual plans only (mandate/add-on flows keep auto-renew).
    const [isOneTime, setIsOneTime] = useState(false);
    const navigate = useNavigate();
    const showOneTimeOption = selectedType === 'annually' && !isMandate;

    // coupon hook
    const {
        isApplied,
        applyCoupon,
        discountAmount,
        isLoading: couponLoading,
        removeCoupon,
        coupon,
    } = useApplyCoupon(planId);

    const { data, isLoading, isRepricing, isError, refetch } = useGetPackageDetails({
        packageId: planId,
        selectedType,
        setTotalPackagePrice,
        couponCode: isApplied && coupon ? coupon : undefined,
    });
    const { xl } = useScreenSize();
    // WhatsApp Basic/Pro pricing lives in the separate whatsappPlans list (same source the
    // plans comparison table uses); fetch it so the review card shows the same description.
    const { whatsappPlans } = useGetPackages();

    const isGstMode = typeof data?.taxAmount === 'number';

    useEffect(() => {
        if (!data) {
            return;
        }
        // The server folds the applied coupon into expectedPaymentAmount — never subtract it twice.
        const serverHasCoupon = Number(data.couponDiscount ?? 0) > 0;
        if (typeof data.taxAmount === 'number' || serverHasCoupon) {
            setFinalPayableAmount(totalPackagePrice > 0 ? totalPackagePrice : 0);
            return;
        }
        const totalPayAmountAfterDiscount = totalPackagePrice - discountAmount;
        setFinalPayableAmount(totalPayAmountAfterDiscount > 0 ? totalPayAmountAfterDiscount : 0);
    }, [totalPackagePrice, discountAmount, data]);
    // voucher code hook
    const subscriptionCodesFn = useSubscriptionCodes(planId);
    const { isValidVoucher, activateSubscriptionCode, setIsValidVoucher, isActivating } =
        subscriptionCodesFn;
    // payment hook
    const {
        handlePaymentRequest,
        isLoading: paymentLoading,
        selectedPaymentMode,
        setselectedPaymentMode,
    } = usePaymentRequest();

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 5 }} className="py-20" />;
    }

    if (isError || !data) {
        return (
            <Flex vertical align="center" justify="center" gap={16} className="py-20 text-center">
                <Typography.Text className="text-base text-textGray">
                    We were unable to load this plan. Please try again.
                </Typography.Text>
                <Flex gap={12}>
                    <Button onClick={refetch}>Try Again</Button>
                    <Button type="primary" danger onClick={() => navigate(`/${paths.plans.index}`)}>
                        Back to Plans
                    </Button>
                </Flex>
            </Flex>
        );
    }

    const handleSubscribePackage = () => {
        if (selectedPaymentMode === SubscriptionPaymentMode.voucherCode) {
            activateSubscriptionCode();
            return;
        }
        handlePaymentRequest({
            billingType: selectedType.toUpperCase(),
            amount: finalPayableAmount,
            packageId: planId,
            couponCode: isApplied ? coupon : undefined,
            successUrl: `${FRONTEND_BASE_URL}/${paths.plans.index}/${paths.plans.paymentsuccess}`,
            failureUrl: `${FRONTEND_BASE_URL}/${paths.plans.index}/${paths.plans.paymentFailure}`,
            currentUrl: window.location.href,
            isMandate,
            isOneTime: showOneTimeOption && isOneTime,
        });
        if (typeof Moengage?.track_event === 'function') {
            const serviceName = data?.packageDetails?.packageName;
            // The main Peko Go/Plus subscription is packageType GROUP; every other package
            // (WhatsApp For Business, Turbo, eSign, Payroll, ...) is an individual à la carte
            // service and gets its own dynamically-named event instead of peko_plan_checkout.
            const isGroupPlan = data?.packageDetails?.packageType === 'GROUP';
            const moengageServiceName = serviceName?.toLowerCase().replace(/\s+/g, '_');

            if (isGroupPlan) {
                Moengage.track_event('peko_plan_checkout', {
                    Peko_plan: serviceName,
                    coupon_code_used: isApplied,
                    total_amount: finalPayableAmount,
                });
            } else if (moengageServiceName) {
                Moengage.track_event(`${moengageServiceName}_checkout`, {
                    [`${moengageServiceName}_plan`]: selectedType,
                    coupon_code_used: isApplied,
                    total_amount: finalPayableAmount,
                });
            }

            // Moengage.track_event(`${serviceName}_checkout_IN`, {
            //     [`${serviceName}_plan`]: selectedType,
            //     coupon_code_used: isApplied,
            //     total_amount: finalPayableAmount,
            //     checkout_viewed: true,
            // });
            sessionStorage.removeItem('service_details');
            sessionStorage.setItem(
                'paymentResult',
                JSON.stringify({
                    total_amount: finalPayableAmount,
                    serviceName,
                    isGroupPlan,
                })
            );
        }
    };
    const hasAddonPrice = Number(data.annualAddonPrice) > 0 || Number(data.monthlyAddonPrice) > 0;
    const displayTotal = isValidVoucher ? 0 : finalPayableAmount;
    let couponDiscountDisplay =
        Number(data.couponDiscount ?? 0) > 0 ? Number(data.couponDiscount) : discountAmount;
    if (isValidVoucher) couponDiscountDisplay = 0;
    // WhatsApp tiers are only offered alongside GROUP plans (Peko Standard/Plus/Go). Individual
    // à-la-carte packages (eSign, Payroll, Turbo, …) must NOT show WhatsApp on their review screen.
    const whatsAppDescription =
        data.packageDetails.packageType === 'GROUP'
            ? getWhatsAppPlanDescription(
                  whatsappPlans,
                  selectedType,
                  data.packageDetails.packageName
              )
            : null;

    const selectAutoRenewPayment = () => {
        setselectedPaymentMode(SubscriptionPaymentMode.card);
        setIsOneTime(false);
        setIsValidVoucher(false);
    };
    const selectOneTimePayment = () => {
        setselectedPaymentMode(SubscriptionPaymentMode.card);
        setIsOneTime(true);
        setIsValidVoucher(false);
    };
    const selectVoucherPayment = () => {
        setselectedPaymentMode(SubscriptionPaymentMode.voucherCode);
        setIsValidVoucher(false);
    };
    const activateOnKey = (action: () => void) => (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action();
        }
    };

    return (
        <Flex gap={30} vertical={!xl} className="items-center xl:items-start">
            <div className="w-full xl:w-[60%] xxl:w-[65%]">
                <PlanInfoCard
                    packageName={data.packageDetails.packageName}
                    selectedType={selectedType}
                    price={data.packageDetails.packagePrices[selectedType]}
                    subtitle={data.packageDetails.description?.split('\n')[0] ?? ''}
                    services={data.packageDetails.services ?? []}
                    isMandate={isMandate}
                    isOneTime={showOneTimeOption && isOneTime}
                    whatsAppDescription={whatsAppDescription}
                />
            </div>
            <Flex
                className="w-full h-full text-xs md:w-2/3  xl:w-[40%] xxl:w-[35%]"
                justify="space-between"
                align="flex-start"
                vertical
                gap={24}
            >
                <EnterCouponCode
                    applyCoupon={applyCoupon}
                    couponLoading={couponLoading}
                    isApplied={isApplied}
                    removeCoupon={removeCoupon}
                    // The coupon endpoint expects the pre-tax base.
                    totalPrice={
                        isGstMode
                            ? Number(data.taxableAmount ?? 0) + Number(data.couponDiscount ?? 0)
                            : totalPackagePrice
                    }
                />
                <Flex
                    className="w-full h-full px-5 py-8 text-xs border border-gray-200 border-solid sm:px-6 rounded-xl"
                    justify="space-between"
                    align="flex-start"
                    vertical
                    gap={24}
                >
                    <Typography.Text className="text-lg font-medium">
                        Select Payment Method
                    </Typography.Text>
                    <Flex vertical gap={12} className="w-full">
                        {/* Auto-renewal (recurring mandate) — the default card payment */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={selectAutoRenewPayment}
                            onKeyDown={activateOnKey(selectAutoRenewPayment)}
                            className={`flex w-full items-center gap-3 rounded-[14px] border border-solid px-[18px] py-4 cursor-pointer transition-colors ${
                                selectedPaymentMode === SubscriptionPaymentMode.card && !isOneTime
                                    ? 'border-bgOrange2'
                                    : 'border-[#e6e9f5]'
                            }`}
                        >
                            <img
                                src={cardLogo}
                                alt="Cashfree"
                                className="w-[71px] h-[22px] object-contain shrink-0"
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-[#1e293b]">
                                    UPI / Debit / Credit / ATM Cards
                                </span>
                                <span className="text-[11px] text-[#737373]">
                                    Auto-renewal (recurring payment)
                                </span>
                            </div>
                        </div>

                        {/* One-time payment — annual plans only */}
                        {showOneTimeOption && (
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={selectOneTimePayment}
                                onKeyDown={activateOnKey(selectOneTimePayment)}
                                className={`flex w-full items-center gap-3 rounded-[14px] border border-solid px-[18px] py-4 cursor-pointer transition-colors ${
                                    selectedPaymentMode === SubscriptionPaymentMode.card &&
                                    isOneTime
                                        ? 'border-bgOrange2'
                                        : 'border-[#e6e9f5]'
                                }`}
                            >
                                <img
                                    src={cardLogo}
                                    alt="Cashfree"
                                    className="w-[71px] h-[22px] object-contain shrink-0"
                                />
                                <div className="flex flex-col gap-1">
                                    <span className="text-[15px] font-medium text-[#1e293b]">
                                        One-time Payment
                                    </span>
                                    <span className="text-xs text-[#737373]">
                                        Pay once for this year. You can renew manually next year to
                                        continue the service.
                                    </span>
                                    <span className="text-xs text-[#595959]">
                                        UPI / Debit / Credit / ATM Cards / Net Banking
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Payment voucher — unchanged behaviour */}
                        {!isMandate && (
                            <>
                                <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={selectVoucherPayment}
                                    onKeyDown={activateOnKey(selectVoucherPayment)}
                                    className={`flex w-full items-center gap-3 rounded-[14px] border border-solid px-[18px] py-4 cursor-pointer transition-colors ${
                                        selectedPaymentMode === SubscriptionPaymentMode.voucherCode
                                            ? 'border-bgOrange2'
                                            : 'border-[#e6e9f5]'
                                    }`}
                                >
                                    <img
                                        src={voucher}
                                        alt="Voucher"
                                        className="w-[32px] h-[24px] object-contain shrink-0"
                                    />
                                    <span className="text-sm font-medium text-[#1e293b]">
                                        I have a payment voucher
                                    </span>
                                </div>
                                {selectedPaymentMode === SubscriptionPaymentMode.voucherCode && (
                                    <SubscriptionVoucher {...subscriptionCodesFn} />
                                )}
                            </>
                        )}
                    </Flex>
                </Flex>
                <Flex
                    className="w-full h-auto px-5 py-6 text-xs border border-gray-200 border-solid sm:px-8 rounded-xl"
                    justify="space-between"
                    vertical
                    gap={18}
                >
                    <Typography.Text className="text-lg font-medium text-zinc-900">
                        Order summary
                    </Typography.Text>
                    <Flex justify="space-between">
                        <GrayText text="Base Price" />
                        <BoldText
                            text={`₹ ${formatNumberWithLocalString(data?.packageDetails?.packagePrices[selectedType])}`}
                        />
                    </Flex>
                    {hasAddonPrice && (
                        <Flex justify="space-between">
                            <GrayText text={`Addon Price ( ${capitalize(selectedType)} )`} />
                            <BoldText
                                text={`₹ ${formatNumberWithLocalString(Number(selectedType === 'monthly' ? data.monthlyAddonPrice : data.annualAddonPrice))}`}
                            />
                        </Flex>
                    )}

                    {isValidVoucher ? (
                        <Flex justify="space-between">
                            <GrayText text="Voucher Discount" />
                            <BoldText
                                text={`₹ ${formatNumberWithLocalString(data?.packageDetails?.packagePrices[selectedType])}`}
                            />
                        </Flex>
                    ) : (
                        Number(data?.packageDetails?.discount?.[selectedType]) > 0 && (
                            <Flex justify="space-between">
                                <GrayText text="Discount" />
                                <BoldText
                                    text={`₹ ${formatNumberWithLocalString(data?.packageDetails?.discount[selectedType])}`}
                                />
                            </Flex>
                        )
                    )}
                    {Number(data?.discount?.price) !== 0 && (
                        <Flex justify="space-between">
                            <div>
                                <GrayText text="Remaining Period Credit" />
                                <Tooltip
                                    autoAdjustOverflow
                                    className="ml-1"
                                    styles={{ body: { color: '#171717', width: '300px' } }}
                                    color="white"
                                    title={
                                        <Typography.Text className="text-xs">
                                            This is the credit from your current plan and add-ons
                                            (if any), calculated based on the unused portion of your
                                            current billing period. It is applied towards your new
                                            plan as your upgrade or change takes effect immediately.
                                        </Typography.Text>
                                    }
                                >
                                    <InfoCircleOutlined />
                                </Tooltip>
                            </div>
                            <BoldText
                                text={`₹ ${formatNumberWithLocalString(Number(data?.discount?.price))}`}
                            />
                        </Flex>
                    )}

                    {isApplied && (
                        <Flex justify="space-between">
                            <GrayText text="Coupon Discount" />
                            <BoldText
                                text={`₹ ${formatNumberWithLocalString(couponDiscountDisplay)}`}
                            />
                        </Flex>
                    )}

                    {isGstMode && !isValidVoucher && Number(data.taxAmount) > 0 && (
                        <>
                            <Flex justify="space-between">
                                <GrayText text="Subtotal" />
                                <BoldText
                                    text={`₹ ${formatNumberWithLocalString(Number(data.taxableAmount ?? 0))}`}
                                />
                            </Flex>
                            <Flex justify="space-between">
                                <GrayText text={formatTaxLabel(data.taxRate)} />
                                <BoldText
                                    text={`₹ ${formatNumberWithLocalString(Number(data.taxAmount))}`}
                                />
                            </Flex>
                        </>
                    )}

                    <Divider />
                    <Flex justify="space-between">
                        <BoldText text="Total Amount" />
                        {isRepricing ? (
                            <Skeleton.Input active size="small" />
                        ) : (
                            <BoldText text={`₹ ${formatNumberWithLocalString(displayTotal)}`} />
                        )}
                    </Flex>

                    <Button
                        loading={paymentLoading || isActivating}
                        disabled={isRepricing}
                        onClick={handleSubscribePackage}
                        htmlType="submit"
                        danger
                        type="primary"
                        className="w-full"
                    >
                        {isRepricing
                            ? 'Updating price…'
                            : `Pay ₹${formatNumberWithLocalString(displayTotal)}`}
                    </Button>
                    <Flex align="center" justify="center" gap={6} className="w-full">
                        <LockOutlined className="text-textGray" />
                        <Typography.Text className="text-xs text-textGray">
                            Secured by 256-bit encryption
                        </Typography.Text>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default PlanDetailsCard;
