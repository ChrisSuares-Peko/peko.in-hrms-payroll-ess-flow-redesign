import { useEffect, useRef, useState } from 'react';

import { ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Empty, Skeleton, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

import { PLURAL_GATEWAY_VISIBLE } from '@src/config-global';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { isCCavenueService } from '@utils/ccavenueServices';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import BillSummaryCard, { BillSummaryCardSkeleton } from './BillSummaryCard';
import CashbackBanner from './CashbackBanner';
import CouponCodeCard from './CouponCodeCard';
import PaymentHeader from './PaymentHeader';
import PaymentMethodCard from './PaymentMethodCard';
import PaymentRedirectLoader from './PaymentRedirectLoader';
import PaymentSummaryCard from './PaymentSummaryCard';
import SessionExpiredModal from '../../Airline/components/SessionExpiredModal';
import useTraceIdTimer from '../../Airline/hooks/useTraceIdTimer';
import useHotelBookingTimer from '../../Hotels/hooks/useHotelBookingTimer';
import CCavenueIframeModal from '../../payments/components/CCavenueIframeModal';
import useGetAllPaymentMode from '../../payments/hooks/useGetAllPaymentMode';
import usePaymentApi from '../../payments/hooks/usePaymentApi';
import useWalletApi from '../../payments/hooks/useWalletApi';
import { PaymentMode } from '../../payments/types/index';
import { loadRazorpayScript } from '../../payments/utils/razorpayCheckout';

const exceedsLimit = (limit?: number, current = 0, added = 0) => !!limit && current + added > limit;

const PaymentSummary = () => {
    const { isPgOptionsLoading, availablePgOptions, isPgDown } = useGetAllPaymentMode();
    const [checkoutJsInstance, setCheckoutJsInstance] = useState(null);
    const [isAmountUpdating, setIsAmountUpdating] = useState(false);
    const { user } = useAppSelector(state => state.reducer.user);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const {
        handleCardPaymentRequest,
        handlePaytmPaymentRequest,
        handleWalletPaymentRequest,
        handleCorporateCardPaymentRequest,
        handleCCavenuePaymentRequest,
        handleMswipePaymentRequest,
        ccavenueUrl,
        setCCavenueUrl,
        isLoading,
        isSpinnerLoading,
        loadCheckoutScript,
        couponFormikRef,
        couponCode,
        setCouponCode,
        applyCoupon,
        removeCoupon,
        isCouponApplied,
        selectedPayment,
        setselectedPayment,
        isCashbackChecked,
        setIsCashbackChecked,
    } = usePaymentApi({
        checkoutJsInstance,
        setCheckoutJsInstance,
    });
    const { walletData, isLoading: isWalletLoading } = useWalletApi();
    const {
        billSummary,
        paymentSummary,
        totalAmount,
        title,
        minimumAmount,
        maximumAmount,
        earningCashbackAmount,
        payload,
        payload: paymentdata,
        isEsimPaymentLoading,
        paymentNote,
        creditBalance,
    } = useAppSelector(state => state.reducer.payment);

    const isAirlinePayment = payload?.accessKey === accessKeys.airline;
    const isLcc = isAirlinePayment
        ? ((payload as any)?.outbount?.isLcc ?? (payload as any)?.isLcc ?? false)
        : false;
    const timer = useTraceIdTimer(isLcc, isAirlinePayment, isLoading || isSpinnerLoading);

    const isHotelPayment = payload?.accessKey === accessKeys.hotels;
    const hotelTimer = useHotelBookingTimer(isHotelPayment);

    const accessKey = payload?.accessKey ?? '';
    const isCCavenue = isCCavenueService(accessKey);

    const isMixedVendor = Array.isArray(payload?.orderGroups) && payload.orderGroups.length > 0;
    const bulkPayment =
        (Array.isArray(payload?.bulkPaymentData) && payload.bulkPaymentData.length > 1) ||
        (['esim', 'esim_tunz'].includes(accessKey) && Number(payload?.quantity) > 1) ||
        isMixedVendor;

    useEffect(() => {
        if (billSummary.length <= 0 && !isEsimPaymentLoading) {
            navigate(paths.dashboard.home);
        }
    }, [navigate, billSummary, isEsimPaymentLoading]);

    const pgProvider = availablePgOptions.gateway.provider;
    useEffect(() => {
        if (isCCavenue) return;
        if (pgProvider === 'RAZORPAY') {
            loadRazorpayScript();
        } else {
            loadCheckoutScript();
        }
    }, [loadCheckoutScript, isCCavenue, pgProvider]);

    const walletBalance = Number(walletData?.balance ?? 0);

    const showWalletPaymentOptions = !!(
        user?.roleName !== 'corporate sub user' &&
        paymentdata &&
        !paymentdata?.isAccountingSubscription &&
        !paymentdata?.isCashfreeOnly &&
        !paymentdata?.isWhatsAppSubscription &&
        !paymentdata?.isPosPurchase &&
        !paymentdata?.isAddOns &&
        !paymentdata?.isGoogleWorkspaceSubscription &&
        availablePgOptions.wallet.available
    );

    // Same exclusions as the wallet, minus the role one: the backend refuses a sub-user itself. Shown whenever
    // the cardholder has a card, so a blocked card explains itself instead of vanishing.
    const corporateCardOption = availablePgOptions.corporateCard;
    const showCorporateCardOption = !!(
        corporateCardOption?.card &&
        paymentdata &&
        !paymentdata?.isAccountingSubscription &&
        !paymentdata?.isWhatsAppSubscription &&
        !paymentdata?.isAddOns &&
        !paymentdata?.isGoogleWorkspaceSubscription &&
        !bulkPayment
    );

    const isWalletDisabled = walletBalance <= 0 || walletBalance <= totalAmount;

    const isWalletLimitExhausted =
        exceedsLimit(availablePgOptions?.wallet?.limits?.limitPerTransaction, 0, totalAmount) ||
        exceedsLimit(
            availablePgOptions?.wallet?.limits?.limitPerDay,
            availablePgOptions.wallet.usage.today,
            totalAmount
        ) ||
        exceedsLimit(
            availablePgOptions?.wallet?.limits?.limitPerMonth,
            availablePgOptions.wallet.usage.month,
            totalAmount
        );

    let walletLimitMessage = '';
    if (exceedsLimit(availablePgOptions?.wallet?.limits?.limitPerTransaction, 0, totalAmount)) {
        walletLimitMessage = 'Your wallet transaction limit has been exceeded.';
    } else if (
        exceedsLimit(
            availablePgOptions?.wallet?.limits?.limitPerDay,
            availablePgOptions.wallet.usage.today,
            totalAmount
        )
    ) {
        walletLimitMessage = 'Your daily wallet transaction limit has been exceeded.';
    } else if (
        exceedsLimit(
            availablePgOptions?.wallet?.limits?.limitPerMonth,
            availablePgOptions.wallet.usage.month,
            totalAmount
        )
    ) {
        walletLimitMessage = 'Your monthly wallet transaction limit has been exceeded.';
    }

    const isPaymentGatewayDisabled =
        (isCashbackChecked &&
            (selectedPayment === PaymentMode.wallet || walletBalance >= totalAmount)) ||
        exceedsLimit(availablePgOptions?.gateway?.limits?.limitPerTransaction, 0, totalAmount) ||
        exceedsLimit(
            availablePgOptions?.gateway?.limits?.limitPerDay,
            availablePgOptions.gateway.usage.today,
            totalAmount
        ) ||
        exceedsLimit(
            availablePgOptions?.gateway?.limits?.limitPerMonth,
            availablePgOptions.gateway.usage.month,
            totalAmount
        );

    let gatewayLimitMessage = '';
    if (exceedsLimit(availablePgOptions?.gateway?.limits?.limitPerTransaction, 0, totalAmount)) {
        gatewayLimitMessage = 'Your payment gateway transaction limit has been exceeded.';
    } else if (
        exceedsLimit(
            availablePgOptions?.gateway?.limits?.limitPerDay,
            availablePgOptions.gateway.usage.today,
            totalAmount
        )
    ) {
        gatewayLimitMessage = 'Your daily payment gateway transaction limit has been exceeded.';
    } else if (
        exceedsLimit(
            availablePgOptions?.gateway?.limits?.limitPerMonth,
            availablePgOptions.gateway.usage.month,
            totalAmount
        )
    ) {
        gatewayLimitMessage = 'Your monthly payment gateway transaction limit has been exceeded.';
    }

    const isPluralDisabled =
        isCashbackChecked &&
        (selectedPayment === PaymentMode.wallet || walletBalance >= totalAmount);

    const showPluralOption = PLURAL_GATEWAY_VISIBLE.toLocaleLowerCase() === 'true';
    const showMswipeOption =
        availablePgOptions.gateway.provider === 'MSWIPE' &&
        availablePgOptions.gateway.available &&
        !isCCavenue &&
        !accessKey.startsWith('bbps_') &&
        accessKey !== accessKeys.officeSupplies &&
        !payload?.billerId &&
        !payload?.isOndc &&
        !payload?.isWhatsAppSubscription &&
        !payload?.isEcommerceSubscription;
    const showGatewayOption = availablePgOptions.gateway.available && !showMswipeOption;

    const hasAutoSelectedRef = useRef(false);

    useEffect(() => {
        if (hasAutoSelectedRef.current) return;
        if (isPgOptionsLoading || isWalletLoading || isPgDown) return;
        if (billSummary.length <= 0 || totalAmount <= 0) return;
        if (selectedPayment !== PaymentMode.empty) {
            hasAutoSelectedRef.current = true;
            return;
        }
        if (showWalletPaymentOptions && !isWalletDisabled && !isWalletLimitExhausted) {
            setselectedPayment(PaymentMode.wallet);
            setIsCashbackChecked(true);
        } else if (showPluralOption && !isPluralDisabled && !isPaymentGatewayDisabled) {
            setselectedPayment(PaymentMode.card);
        } else if (showGatewayOption && !isPaymentGatewayDisabled) {
            setselectedPayment(isCCavenue ? PaymentMode.CCAVENUE : PaymentMode.PAYTM);
        } else if (showMswipeOption && !isPaymentGatewayDisabled) {
            setselectedPayment(PaymentMode.MSWIPE);
        } else {
            return;
        }
        hasAutoSelectedRef.current = true;
    }, [
        isPgOptionsLoading,
        isWalletLoading,
        isPgDown,
        billSummary.length,
        totalAmount,
        selectedPayment,
        showWalletPaymentOptions,
        isWalletDisabled,
        isWalletLimitExhausted,
        showPluralOption,
        isPluralDisabled,
        showGatewayOption,
        showMswipeOption,
        isPaymentGatewayDisabled,
        isCCavenue,
        setselectedPayment,
        setIsCashbackChecked,
    ]);

    const handleIframeComplete = (resultUrl: string) => {
        setCCavenueUrl(null);
        const url = new URL(resultUrl);
        navigate(url.pathname + url.search);
    };

    const handlePayment = async () => {
        if (selectedPayment === PaymentMode.CCAVENUE) {
            await handleCCavenuePaymentRequest();
            return;
        }
        if (selectedPayment === PaymentMode.card) {
            if (isPaymentGatewayDisabled && gatewayLimitMessage) {
                dispatch(
                    showToast({
                        description: `${gatewayLimitMessage} Please use another payment method or contact support for assistance.`,
                        variant: 'error',
                    })
                );
                return;
            }
            handleCardPaymentRequest({
                isChecked: isCashbackChecked,
                balance: walletBalance,
            });
        } else if (selectedPayment === PaymentMode.PAYTM) {
            if (isPaymentGatewayDisabled && gatewayLimitMessage) {
                dispatch(
                    showToast({
                        description: `${gatewayLimitMessage} Please use another payment method or contact support for assistance.`,
                        variant: 'error',
                    })
                );
                return;
            }
            await handlePaytmPaymentRequest({
                isChecked: isCashbackChecked,
                balance: walletBalance,
                gateway: pgProvider,
            });
        } else if (selectedPayment === PaymentMode.MSWIPE) {
            if (isPaymentGatewayDisabled && gatewayLimitMessage) {
                dispatch(
                    showToast({
                        description: `${gatewayLimitMessage} Please use another payment method or contact support for assistance.`,
                        variant: 'error',
                    })
                );
                return;
            }
            await handleMswipePaymentRequest({
                isChecked: isCashbackChecked,
                balance: walletBalance,
                // gateway: pgProvider,
            });
        } else if (selectedPayment === PaymentMode.wallet) {
            if (isWalletLimitExhausted && walletLimitMessage) {
                dispatch(
                    showToast({
                        description: `${walletLimitMessage} Please use another payment method or contact support for assistance.`,
                        variant: 'error',
                    })
                );
                return;
            }
            handleWalletPaymentRequest();
        } else if (selectedPayment === PaymentMode.corporateCard) {
            await handleCorporateCardPaymentRequest();
        }
    };

    const handleSelectCorporateCard = () => {
        removeCoupon();
        setIsCashbackChecked(false);
        setselectedPayment(PaymentMode.corporateCard);
    };

    const handleSelectWallet = () => {
        removeCoupon();
        setselectedPayment(PaymentMode.wallet);
        setIsCashbackChecked(true);
    };

    const handleSelectPlural = () => {
        setselectedPayment(PaymentMode.card);
    };

    const handleSelectGateway = () => {
        setIsCashbackChecked(false);
        setselectedPayment(isCCavenue ? PaymentMode.CCAVENUE : PaymentMode.PAYTM);
    };

    const handleSelectMswipe = () => {
        setIsCashbackChecked(false);
        setselectedPayment(PaymentMode.MSWIPE);
    };

    const applyCouponOnShownGateway = (
        code: string,
        setSubmitting: (isSubmitting: boolean) => void
    ) => applyCoupon(code, setSubmitting, showMswipeOption ? PaymentMode.MSWIPE : undefined);

    let payAmount = totalAmount ?? 0;
    if (isCashbackChecked) {
        payAmount =
            selectedPayment === PaymentMode.wallet ? totalAmount : totalAmount - walletBalance;
    }

    const isPayDisabled =
        isAmountUpdating ||
        !!creditBalance ||
        totalAmount <= 0 ||
        selectedPayment === PaymentMode.empty ||
        (walletBalance < totalAmount && selectedPayment === PaymentMode.wallet) ||
        (!!minimumAmount && Number(payload?.amount) < minimumAmount) ||
        (!!maximumAmount && Number(payload?.amount) > maximumAmount);

    if (isPgOptionsLoading || isEsimPaymentLoading) {
        return <Skeleton active paragraph={{ rows: 13 }} />;
    }

    if (
        isLoading &&
        (selectedPayment === PaymentMode.card ||
            selectedPayment === PaymentMode.wallet ||
            selectedPayment === PaymentMode.MSWIPE ||
            selectedPayment === PaymentMode.corporateCard)
    ) {
        let loaderMessage: string | undefined;
        if (selectedPayment === PaymentMode.wallet) {
            loaderMessage = 'Please wait, we are processing your wallet payment';
        } else if (selectedPayment === PaymentMode.corporateCard) {
            loaderMessage = 'Please wait, we are processing your corporate card payment';
        }
        return <PaymentRedirectLoader message={loaderMessage} />;
    }

    const showAirlineTimer =
        isAirlinePayment && timer.searchInitiatedAt && !timer.isExpired && !timer.isPaymentExpired;
    const showHotelTimer =
        isHotelPayment &&
        hotelTimer.searchInitiatedAt &&
        hotelTimer.showTimer &&
        !hotelTimer.isExpired;

    return (
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-4 xxl:max-w-[1000px]">
            <PaymentHeader accessKeyName={payload?.accessKey} />

            {showAirlineTimer && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <ClockCircleOutlined className="text-sm text-slate-500 sm:text-base" />
                    <span className="text-xs text-slate-500">
                        {(() => {
                            if (isLcc) {
                                return 'Complete payment in';
                            }
                            if (!timer.bookingCompletedAt) {
                                return 'Complete booking in';
                            }
                            return 'Complete payment in';
                        })()}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 sm:text-base">
                        {timer.formatTime(timer.timeRemaining)}
                    </span>
                </div>
            )}

            {showHotelTimer && (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <ClockCircleOutlined className="text-sm text-slate-500 sm:text-base" />
                    <span className="text-xs text-slate-500">Complete payment in</span>
                    <span className="text-sm font-semibold text-slate-900 sm:text-base">
                        {hotelTimer.formatTime(hotelTimer.timeRemaining)}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr] xl:gap-6">
                <div className="flex flex-col gap-4">
                    {billSummary.length <= 0 ? (
                        <BillSummaryCardSkeleton />
                    ) : (
                        <BillSummaryCard
                            title={title}
                            billSummary={billSummary}
                            minimumAmount={minimumAmount}
                            maximumAmount={maximumAmount}
                            paymentNote={paymentNote}
                            creditBalance={creditBalance}
                            setIsCashbackChecked={setIsCashbackChecked}
                            isLoading={isLoading}
                            removeCoupon={removeCoupon}
                            onAmountUpdatingChange={setIsAmountUpdating}
                        />
                    )}

                    {!!earningCashbackAmount && earningCashbackAmount > 0 && (
                        <CashbackBanner amount={earningCashbackAmount} />
                    )}

                    {isPgDown ? (
                        <div className="w-full rounded-2xl bg-white p-6 shadow-[0_1.5px_8.25px_rgba(0,0,0,0.06)]">
                            <Empty description="No payment methods are available right now." />
                        </div>
                    ) : (
                        <PaymentMethodCard
                            showCorporateCardOption={showCorporateCardOption}
                            corporateCardOption={corporateCardOption}
                            totalAmount={totalAmount}
                            onSelectCorporateCard={handleSelectCorporateCard}
                            showWalletPaymentOptions={showWalletPaymentOptions}
                            walletBalance={walletBalance}
                            isWalletDisabled={isWalletDisabled}
                            isWalletLoading={isWalletLoading}
                            showPluralOption={showPluralOption}
                            showGatewayOption={showGatewayOption}
                            showMswipeOption={showMswipeOption}
                            isCCavenue={isCCavenue}
                            isPluralDisabled={isPluralDisabled}
                            selectedPayment={selectedPayment}
                            onSelectWallet={handleSelectWallet}
                            onSelectPlural={handleSelectPlural}
                            onSelectGateway={handleSelectGateway}
                            onSelectMswipe={handleSelectMswipe}
                            onAddFunds={() => navigate(`/${paths.pekoWallet.index}`)}
                            isLoading={isLoading}
                        />
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {!bulkPayment && availablePgOptions.gateway.available && (
                        <CouponCodeCard
                            applyCoupon={applyCouponOnShownGateway}
                            isApplied={isCouponApplied}
                            appliedCouponCode={couponCode}
                            removeCoupon={removeCoupon}
                            setCouponCode={setCouponCode}
                            couponFormikRef={couponFormikRef}
                            isDisabled={isLoading}
                        />
                    )}

                    <PaymentSummaryCard
                        paymentSummary={paymentSummary}
                        totalAmount={creditBalance ? 0 : totalAmount}
                        payLabel={
                            creditBalance
                                ? 'No Payment Due'
                                : `Pay ₹ ${formatNumberWithLocalString(payAmount)}`
                        }
                        isPayDisabled={isPayDisabled}
                        isLoading={isLoading}
                        onPay={handlePayment}
                    />
                </div>
            </div>

            {isSpinnerLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </div>
            )}
            {isAirlinePayment && (
                <SessionExpiredModal open={timer.showExpiredModal} onGoBack={timer.handleGoBack} />
            )}
            {ccavenueUrl && (
                <CCavenueIframeModal
                    url={ccavenueUrl}
                    onComplete={handleIframeComplete}
                    onClose={() => setCCavenueUrl(null)}
                />
            )}
        </div>
    );
};

export default PaymentSummary;
