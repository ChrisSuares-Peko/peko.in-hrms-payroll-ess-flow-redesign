/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';

import { CheckCircleFilled, ClockCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import {
    Alert,
    Button,
    Card,
    Col,
    Empty,
    Flex,
    Image,
    Radio,
    Row,
    Skeleton,
    Spin,
    Typography,
} from 'antd';
import { useNavigate } from 'react-router-dom';

import cashfreeLogo from '@assets/images/cashfreeLogo.png';
import ccAvenueLogo from '@assets/images/ccAvenueLogo.png';
import { PLURAL_GATEWAY_VISIBLE } from '@src/config-global';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { isCCavenueService } from '@utils/ccavenueServices';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import CancelAndBack from './CancelAndBack';
import CCavenueIframeModal from './CCavenueIframeModal';
import EnterCouponCode from './EnterCouponCode';
import PaymentHeader from './PaymentHeader';
import PaymentOptions from './PaymentOptions';
import Summary from './Summary';
import SessionExpiredModal from '../../Airline/components/SessionExpiredModal';
import useTraceIdTimer from '../../Airline/hooks/useTraceIdTimer';
import useHotelBookingTimer from '../../Hotels/hooks/useHotelBookingTimer';
import { WHATSAPP_DEMO_EMAIL } from '../../WhatsappForBusiness/utils/index';
import pluralLogo from '../assets/images/pluralLogo.png';
import pekoLogo from '../assets/svg/peko-logo.svg';
import walletIcon from '../assets/svg/wallet.svg';
import useGetAllPaymentMode from '../hooks/useGetAllPaymentMode';
import usePaymentApi from '../hooks/usePaymentApi';
import useWalletApi from '../hooks/useWalletApi';
import { selectPaymentVariant } from '../slices/payment';
import { PaymentMode } from '../types/index';

const PaymentSummary = () => {
    const { isPgOptionsLoading, availablePgOptions, isPgDown } = useGetAllPaymentMode();
    const { Text } = Typography;
    const [checkoutJsInstance, setCheckoutJsInstance] = useState(null);
    const { user } = useAppSelector(state => state.reducer.user);
    const { sm } = useScreenSize();
    const dispatch = useAppDispatch();
    const {
        handleCardPaymentRequest,
        handlePaytmPaymentRequest,
        handleWalletPaymentRequest,
        handleCCavenuePaymentRequest,
        ccavenueUrl,
        setCCavenueUrl,
        isLoading,
        isSpinnerLoading,
        loadCheckoutScript,
        couponFormikRef,
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
    const { walletData } = useWalletApi();
    const {
        billSummary,
        paymentSummary,
        totalAmount,
        title,
        earningCashbackAmount,
        payload,
        payload: paymentdata,
        isEsimPaymentLoading,
        paymentNote,
        variantOptions,
        selectedVariantId,
    } = useAppSelector(state => state.reducer.payment);

    const isAirlinePayment = payload?.accessKey === accessKeys.airline;
    const isLcc = isAirlinePayment
        ? (payload as any)?.outbount?.isLcc ?? (payload as any)?.isLcc ?? false
        : false;
    const timer = useTraceIdTimer(isLcc,isAirlinePayment);


     const isHotelPayment = payload?.accessKey === accessKeys.hotels;
   
    const hotelTimer = useHotelBookingTimer(isHotelPayment);

    const accessKey = payload?.accessKey ?? '';
    const isCCavenue = isCCavenueService(accessKey);

    const isMixedVendor = Array.isArray(payload?.orderGroups) && payload.orderGroups.length > 0;
    const bulkPayment =
        (Array.isArray(payload?.bulkPaymentData) && payload.bulkPaymentData.length > 1) ||
        (['esim', 'esim_tunz'].includes(accessKey) &&
            Number(payload?.quantity) > 1) ||
        isMixedVendor;

    const navigate = useNavigate();
    useEffect(() => {
        if (billSummary.length <= 0 && !isEsimPaymentLoading) {
            navigate(paths.dashboard.home);
        }
    }, [navigate, billSummary, isEsimPaymentLoading]);

    useEffect(() => {
        if (!isCCavenue) {
            loadCheckoutScript();
        }
    }, [loadCheckoutScript, isCCavenue]);

    if (isPgOptionsLoading || isEsimPaymentLoading) {
        return <Skeleton />;
    }

    const showWalletPaymentOptions =
        user?.roleName !== 'corporate sub user' &&
        paymentdata &&
        !paymentdata?.isAccountingSubscription &&
        !paymentdata?.isCashfreeOnly &&
        !paymentdata?.isEcommerceSubscription &&
        !paymentdata?.isWhatsAppSubscription &&
        !paymentdata?.isPosPurchase &&
        !paymentdata?.isAddOns &&
        !paymentdata?.isGoogleWorkspaceSubscription &&
        availablePgOptions.wallet.available;
    const exceedsLimit = (limit?: number, current = 0, added = 0) =>
        !!limit && current + added > limit;
    const isWalletDisabled =
        Number(walletData?.balance!) <= 0 || // Wallet is empty
        Number(walletData?.balance!) <= totalAmount;
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
    } else {
        walletLimitMessage = '';
    }

    const isPaymentGatewayDisabled =
        (isCashbackChecked &&
            (selectedPayment === PaymentMode.wallet ||
                Number(walletData?.balance!) >= totalAmount)) ||
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
    } else {
        gatewayLimitMessage = '';
    }

    const handleIframeComplete = (resultUrl: string) => {
        setCCavenueUrl(null);
        const url = new URL(resultUrl);
        navigate(url.pathname + url.search);
    };

    const handlePayment = async () => {
        if (selectedPayment === PaymentMode.CCAVENUE) {
            await handleCCavenuePaymentRequest();
            return false;
        }
        if (selectedPayment === PaymentMode.card) {
            if (isPaymentGatewayDisabled && gatewayLimitMessage) {
                dispatch(
                    showToast({
                        description: `${gatewayLimitMessage} Please use another payment method or contact support for assistance.`,
                        variant: 'error',
                    })
                );
                return false;
            }
            handleCardPaymentRequest({
                isChecked: isCashbackChecked,
                balance: Number(walletData?.balance),
            });
        } else if (selectedPayment === PaymentMode.PAYTM) {
            if (isPaymentGatewayDisabled && gatewayLimitMessage) {
                dispatch(
                    showToast({
                        description: `${gatewayLimitMessage} Please use another payment method or contact support for assistance.`,
                        variant: 'error',
                    })
                );
                return false;
            }
            await handlePaytmPaymentRequest({
                isChecked: isCashbackChecked,
                balance: Number(walletData?.balance),
            });
        } else if (selectedPayment === PaymentMode.wallet) {
            if (isWalletLimitExhausted && walletLimitMessage) {
                dispatch(
                    showToast({
                        description: `${walletLimitMessage} Please use another payment method or contact support for assistance.`,
                        variant: 'error',
                    })
                );
                return false;
            }
            handleWalletPaymentRequest();
        }

        return false;
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            <Row>
                <CancelAndBack className="mb-6" />
                <PaymentHeader accessKeyName={payload?.accessKey} />
                <Col xs={24} xl={12}>
                    {billSummary.length <= 0 ? (
                        <Skeleton active paragraph={{ rows: 13 }} />
                    ) : (
                        <Card
                            className="h-full border-0 sm:p-7 sm:rounded-2xl sm:border border-borderGray md:p-10"
                            styles={{ body: { padding: 0 } }}
                        >
                            <Flex vertical gap={25}>
                                <Typography.Title level={5}>
                                    {title ?? 'Bill Summary'}
                                </Typography.Title>
                                {billSummary.map((item, index) => (
                                    <Summary
                                        key={`${item.key}-${index}`}
                                        headName={item.key}
                                        value={item.value}
                                        isInput={item.isInput}
                                        subText={item.subText}
                                        setIsCashbackChecked={setIsCashbackChecked}
                                    />
                                ))}
                                {Array.isArray(variantOptions) && variantOptions.length > 1 && (
                                    <Flex vertical gap={10}>
                                        <Typography.Text className="text-sm font-semibold">
                                            Choose a plan
                                        </Typography.Text>
                                        <Radio.Group
                                            value={selectedVariantId}
                                            onChange={e =>
                                                dispatch(selectPaymentVariant(e.target.value))
                                            }
                                            className="flex flex-col w-full gap-2"
                                        >
                                            {variantOptions.map(opt => (
                                                <Radio
                                                    key={opt.vendorCatalogId}
                                                    value={opt.vendorCatalogId}
                                                    className="p-3 m-0 border rounded-xl border-borderGray"
                                                >
                                                    <Typography.Text className="text-sm">
                                                        {opt.label}
                                                        {' — ₹ '}
                                                        {formatNumberWithLocalString(opt.price)}
                                                    </Typography.Text>
                                                </Radio>
                                            ))}
                                        </Radio.Group>
                                    </Flex>
                                )}
                                {/* {(minimumAmount || maximumAmount) && (
                                    <Typography.Text className="text-xs text-right sm:text-sm text-orange-500">
                                        {minimumAmount && maximumAmount
                                            ? `Min: ₹ ${minimumAmount} and Max: ₹ ${maximumAmount}`
                                            : minimumAmount
                                            ? `Minimum amount: ₹ ${minimumAmount}`
                                            : `Maximum amount: ₹ ${maximumAmount}`}
                                    </Typography.Text>
                                )} */}
                                <Typography.Title level={5}>Total Payment Summary</Typography.Title>
                                {paymentSummary.map(item => (
                                    <Summary
                                        headName={item.key}
                                        value={item.value}
                                        key={item.key}
                                    />
                                ))}
                                <Row justify="space-between">
                                    <Col span={14}>
                                        <Typography.Title level={5}>
                                            Amount Payable
                                        </Typography.Title>
                                    </Col>
                                    <Col span={10}>
                                        <Typography.Text className="text-base font-medium">
                                            ₹ {formatNumberWithLocalString(totalAmount ?? 0)}
                                        </Typography.Text>
                                    </Col>
                                </Row>
                                {paymentNote &&
                                    (!!paymentNote.includes?.length || !!paymentNote.description) && (
                                        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#faf8f7] border border-borderGray">
                                            <Typography.Text className="text-sm font-semibold">
                                                Please note
                                            </Typography.Text>
                                            {!!paymentNote.includes?.length && (
                                                <div className="flex flex-col gap-2">
                                                    <Typography.Text className="text-xs font-medium text-gray-500">
                                                        What&apos;s included
                                                    </Typography.Text>
                                                    {paymentNote.includes.map(item => (
                                                        <Flex key={item} align="start" gap={8}>
                                                            <CheckCircleFilled
                                                                style={{
                                                                    fontSize: 14,
                                                                    color: '#22c55e',
                                                                    marginTop: 3,
                                                                }}
                                                            />
                                                            <Typography.Text className="text-xs sm:text-sm text-gray-600">
                                                                {item}
                                                            </Typography.Text>
                                                        </Flex>
                                                    ))}
                                                </div>
                                            )}
                                            {!!paymentNote.description && (
                                                <Typography.Paragraph className="!mb-0 text-xs sm:text-sm text-gray-500">
                                                    {paymentNote.description}
                                                </Typography.Paragraph>
                                            )}
                                        </div>
                                    )}
                            </Flex>
                        </Card>
                    )}
                </Col>
                <Col
                    xs={24}
                    xl={{ span: 11, offset: 1 }}
                    className={`my-5 xl:my-0 ${!!earningCashbackAmount && earningCashbackAmount > 0 && 'h-full'}`}
                >
                    {!!earningCashbackAmount && earningCashbackAmount > 0 && (
                        <Row className="flex items-center justify-center px-3 py-3 mb-3 rounded-md sm:rounded-xl sm:px-10 sm:py-6 bg-bgGreenPayment">
                            <Flex align="center" justify="center">
                                <Image
                                    src={walletIcon}
                                    alt="wallet"
                                    preview={false}
                                    height={20}
                                    className=""
                                />
                                <Text className="ml-2 text-xs text-center text-white sm:ml-5 sm:text-base xxl:text-xl">
                                    Congratulations! You will get a cashback of ₹{' '}
                                    {earningCashbackAmount}
                                </Text>
                            </Flex>
                        </Row>
                    )}
                    {isAirlinePayment &&
                        timer.searchInitiatedAt &&
                        !timer.isExpired &&
                        !timer.isPaymentExpired && (
                            <Card
                                className="mb-4 bg-gray-100 xl:mb-0 xl:absolute xl:-top-16 xl:left-0 xl:right-0 xl:z-10 border-0 sm:rounded-2xl sm:border"
                                styles={{ body: { padding: 0 } }}
                            >
                                <Flex
                                    align="center"
                                    justify="center"
                                    gap={8}
                                    className="p-1 md:p-2"
                                >
                                    <ClockCircleOutlined className="text-gray-600 text-sm sm:text-lg" />
                                    <Typography.Text className="text-xs text-gray-600">
                                        {(() => {
                                            if (isLcc) {
                                                return 'Complete payment in';
                                            }
                                            if (!timer.bookingCompletedAt) {
                                                return 'Complete booking in';
                                            }
                                            return 'Complete payment in';
                                        })()}
                                    </Typography.Text>
                                    <Typography.Text className="text-sm sm:text-lg font-medium text-black">
                                        {timer.formatTime(timer.timeRemaining)}
                                    </Typography.Text>
                                </Flex>
                            </Card>
                        )}

                    {isHotelPayment &&
                        hotelTimer.searchInitiatedAt &&
                        hotelTimer.showTimer &&
                        !hotelTimer.isExpired && (
                            <Card
                                className="mb-4 bg-gray-100 xl:mb-0 xl:absolute xl:-top-16 xl:left-0 xl:right-0 xl:z-10 border-0 sm:rounded-2xl sm:border"
                                styles={{ body: { padding: 0 } }}
                            >
                                <Flex
                                    align="center"
                                    justify="center"
                                    gap={8}
                                    className="p-1 md:p-2"
                                >
                                    <ClockCircleOutlined className="text-gray-600 text-sm sm:text-lg" />
                                    <Typography.Text className="text-xs text-gray-600">
                                        Complete payment in
                                    </Typography.Text>
                                    <Typography.Text className="text-sm sm:text-lg font-medium text-black">
                                        {hotelTimer.formatTime(hotelTimer.timeRemaining)}
                                    </Typography.Text>
                                </Flex>
                            </Card>
                        )}

                        

                    {isPgDown ? (
                        <Empty />
                    ) : (
                        <div className="xl:relative">
                            <Card
                                className="h-full border-0 sm:p-7 sm:rounded-2xl sm:border border-borderGray md:p-10"
                                styles={{ body: { padding: 0 } }}
                            >
                            <Flex vertical gap={25}>
                                <Typography.Title level={5}>
                                    Choose your payment method
                                </Typography.Title>
                                {!bulkPayment && (
                                    <EnterCouponCode
                                        applyCoupon={applyCoupon}
                                        isApplied={isCouponApplied}
                                        removeCoupon={removeCoupon}
                                        setCouponCode={setCouponCode}
                                        couponFormikRef={couponFormikRef}
                                        isDisabled={isLoading}
                                    />
                                )}
                                {showWalletPaymentOptions && (
                                    <>
                                        <PaymentOptions
                                            optionName="Wallet :"
                                            walletAmount={formatNumberWithLocalString(
                                                walletData?.balance || 0
                                            )}
                                            image={pekoLogo}
                                            checked={selectedPayment === PaymentMode.wallet}
                                            handleSelection={() => {
                                                removeCoupon();
                                                setselectedPayment(PaymentMode.wallet);
                                                setIsCashbackChecked(true);
                                            }}
                                            disabled={isWalletDisabled}
                                        />
                                        {isWalletDisabled && (
                                            <Alert
                                                className="p-4 text-xs border-none rounded-xl sm:text-sm md:font-medium"
                                                message="Insufficient wallet balance. Please add funds to proceed."
                                                type="warning"
                                                action={
                                                    <Button
                                                        type="default"
                                                        size="small"
                                                        onClick={() =>
                                                            navigate(`/${paths.pekoWallet.index}`)
                                                        }
                                                        // danger
                                                        className="text-xs bg-yellow-50 border-brandColor text-brandColor md:px-3 md:text-sm"
                                                    >
                                                        Add Funds
                                                    </Button>
                                                }
                                                showIcon={!!sm}
                                            />
                                        )}

                                            {/* <Checkbox
                                            onChange={e => {
                                                setIsCashbackChecked(e.target.checked);
                                                if (
                                                    e.target.checked &&
                                                    Number(walletData?.balance!) >= totalAmount
                                                ) {
                                                    setselectedPayment(PaymentMode.wallet);
                                                } else if (
                                                    !e.target.checked &&
                                                    Number(walletData?.balance!) >= totalAmount
                                                ) {
                                                    setselectedPayment(PaymentMode.empty);
                                                }
                                            }}
                                            disabled={Number(walletData?.balance!) <= 0}
                                            checked={isCashbackChecked}
                                            className="w-fit"
                                        >
                                            Use your Wallet ₹{' '}
                                            {formatNumberWithLocalString(walletData?.balance || 0)}
                                        </Checkbox> */}
                                        </>
                                    )}
                                    {PLURAL_GATEWAY_VISIBLE.toLocaleLowerCase() === 'true' && (
                                        <PaymentOptions
                                            optionName="Debit/Credit/UPI/Net Banking"
                                            image={pluralLogo}
                                            checked={selectedPayment === PaymentMode.card}
                                            handleSelection={() => {
                                                setselectedPayment(PaymentMode.card);
                                            }}
                                            disabled={
                                                isCashbackChecked &&
                                                (selectedPayment === PaymentMode.wallet ||
                                                    Number(walletData?.balance!) >= totalAmount)
                                            }
                                        />
                                    )}
                                    {availablePgOptions.gateway.available &&
                                        (isCCavenue ? (
                                            <PaymentOptions
                                                optionName="BHIM/UPI/Credit Card/Debit Card/Bank Account"
                                                image={ccAvenueLogo}
                                                checked={selectedPayment === PaymentMode.CCAVENUE}
                                                handleSelection={() => {
                                                    setIsCashbackChecked(false);
                                                    setselectedPayment(PaymentMode.CCAVENUE);
                                                }}
                                            />
                                        ) : (
                                            <PaymentOptions
                                                optionName="BHIM/UPI/Credit Card/Debit Card/Bank Account"
                                                image={cashfreeLogo}
                                                checked={selectedPayment === PaymentMode.PAYTM}
                                                handleSelection={() => {
                                                    setIsCashbackChecked(false);
                                                    setselectedPayment(PaymentMode.PAYTM);
                                                }}
                                            />
                                        ))}
                                    {/* {isPaymentGatewayDisabled && gatewayLimitMessage && (

                                    <Alert
                                        className="text-xs border-none sm:text-sm md:font-medium"
                                        message={`${gatewayLimitMessage} Please use another payment method or contact support for assistance.`}
                                        type="warning"
                                        showIcon={!!sm}
                                    />
                                )} */}

                                <Button
                                    danger
                                    type="primary"
                                    size="large"
                                    disabled={
                                        // Demo account: WhatsApp payments disabled
                                        (payload?.accessKey === accessKeys.whatsappBasic &&
                                            user?.email?.toLowerCase() === WHATSAPP_DEMO_EMAIL) ||
                                        totalAmount <= 0 ||
                                        selectedPayment === PaymentMode.empty ||
                                        (Number(walletData?.balance!) < totalAmount &&
                                            selectedPayment === PaymentMode.wallet)
                                    }
                                    onClick={handlePayment}
                                    loading={isLoading}
                                    className="h-14"
                                >
                                    {`Pay ₹
                            ${formatNumberWithLocalString(isCashbackChecked && selectedPayment === PaymentMode.wallet ? totalAmount : isCashbackChecked ? totalAmount - Number(walletData?.balance!) : (totalAmount ?? 0))}`}
                                    </Button>
                                </Flex>
                            </Card>
                        </div>
                    )}
                </Col>

                {/* {checkoutJsInstance && merchantConfig && (
                    <CheckoutProvider
                        config={merchantConfig}
                        openInPopup
                        env={ENV === 'staging' ? 'STAGE' : 'PROD'}
                        checkoutJsInstance={checkoutJsInstance}
                    >
                        {showPaytmModal && <Checkout />}
                    </CheckoutProvider>
                )} */}
                {/* <PaymentFooter /> */}
            </Row>
            {isSpinnerLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-60">
                    <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </div>
            )}
            {isAirlinePayment && (
                <SessionExpiredModal
                    open={timer.showExpiredModal}
                    onGoBack={timer.handleGoBack}
                />
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
