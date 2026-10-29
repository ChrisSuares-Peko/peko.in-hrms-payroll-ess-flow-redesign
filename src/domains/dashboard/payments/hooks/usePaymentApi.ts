import { useCallback, useEffect, useRef, useState } from 'react';

import { load } from '@cashfreepayments/cashfree-js';
import { FormikProps } from 'formik';
import { useNavigate } from 'react-router-dom';

import { PAYMENT_FAiLURE_URL, PAYMENT_SUCCESS_URL, ENV } from '@src/config-global';
import { PLAN_DETAILS_SESSION_KEY, buildPricingSummary } from '@src/domains/dashboard/plans/utils';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { setUserInfo } from '@src/slices/userSlice';
import { accessKeys } from '@utils/accessKeys';
import { isCCavenueService } from '@utils/ccavenueServices';
import { formatAmountBoundError, formatNumberWithLocalString, roundMoney } from '@utils/priceFormat';

import { setVisaOrderNumber } from '../../CorporateTravel/store/visaSlice';
import { getSubscriptionPricing, postApplyCoupon } from '../../plans/api';
import { ApplyCouponResponse } from '../../plans/types';
import {
    createPaymentLink,
    doWalletPayment,
    doCorporateCardPayment,
    createPGTransaction,
    createSubscriptionOrderFromPayments,
    completePGPayment,
    initiateCCavenuePayment,
    initiateMswipePayment,
    createRazorpayOrder,
    completeRazorpayPayment,
    // checkAgencyBalanceApi,
} from '../api/index';
import { setPaymentData } from '../slices/payment';
import {
    CardPaymentResponse,
    GatewayProviderCode,
    PaymentFailureState,
    PaymentMode,
    PaymentResponse,
    UsePaymentApiProps,
} from '../types/index';
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpayCheckout';

const SERVICE_NAME_MAP: Record<string, string> = {
    Airline: 'flight',
    Hotels: 'hotel',
    'Gift Cards': 'giftcard',
    'WhatsApp for Business': 'wa',
    'Mobile Prepaid': 'prepaid',
    'Mobile Postpaid': 'postpaid',
    'Electricity Bill': 'electricity',
    'LPG Cylinder': 'lpg_cylinder',
    'Piped Gas': 'piped_gas',
    'Broadband Bill': 'broadband',
    'Water Bill': 'water',
    'DTH Recharge': 'dth_recharge',
    'FASTag Recharge': 'fastag_recharge',
    'Landline Bill': 'landline',
    'Prepaid Meter': 'prepaid_meter',
    'Domain & Hosting': 'domain',
    Logistics: 'logistics',
};

const getMoengageServiceName = (serviceName: string | number | undefined) => {
    const name = String(serviceName ?? '');
    return SERVICE_NAME_MAP[name] || name || 'N/A';
};

// The visa order is finalized by an async webhook that can still be in
// flight when this call lands, so the backend replies "processing" rather
// than with the final orderNumber — retry a few times to give it a chance
// to land before falling back to the generic pending page.
function retryIfPending<T extends { pending?: boolean; processing?: boolean }>(
    fn: () => Promise<T | false>,
    retries = 4,
    delayMs = 1500
): Promise<T | false> {
    return fn().then(res => {
        if (!res || (!res.pending && !res.processing) || retries === 0) return res;
        return new Promise<void>(resolve => setTimeout(resolve, delayMs)).then(() =>
            retryIfPending(fn, retries - 1, delayMs)
        );
    });
}

const COUPON_GATEWAY_MODES = [PaymentMode.PAYTM, PaymentMode.CCAVENUE, PaymentMode.MSWIPE];

export default function usePaymentApi({
    setCheckoutJsInstance,
    checkoutJsInstance,
    successBasePath = '',
}: UsePaymentApiProps) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const paymentState = useAppSelector(state => state.reducer.payment);
    const { searchInitiatedAt } = useAppSelector(state => state.reducer.airline);
    const serviceDetails = sessionStorage.getItem('service_details');

    const [selectedPayment, setselectedPayment] = useState<PaymentMode>(PaymentMode.empty);
    const [isCashbackChecked, setIsCashbackChecked] = useState<boolean>(false);
    const [ccavenueUrl, setCCavenueUrl] = useState<string | null>(null);

    const {
        payload,
        totalAmount,
        url,
        minimumAmount,
        maximumAmount,
        couponDiscount,
        billSummary,
        successPath,
    } = useAppSelector(state => state.reducer.payment);

    const excludedFromCheckoutEvent = [accessKeys.subscriptions].includes(payload?.accessKey!);
    const [isLoading, setIsLoading] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    // const [totalAmountBeforeCoupon, setTotalAmountBeforeCoupon] = useState(totalAmount);
    const couponFormikRef = useRef<FormikProps<{ couponCode: string }> | null>(null);
    const [isSpinnerLoading, setIsSpinnerLoading] = useState(false);

    const navigate = useNavigate();

    const base = successBasePath;
    const navSuccess = base
        ? `${base}/${paths.payments.paymentsuccess}`
        : paths.payments.paymentsuccess;
    const navFailure = base
        ? `${base}/${paths.payments.paymentFailure}`
        : paths.payments.paymentFailure;
    const navPending = base
        ? `${base}/${paths.payments.paymentPending}`
        : paths.payments.paymentPending;

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                setIsLoading(false);
                setIsSpinnerLoading(false);
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    const repriceEcommerce = useCallback(
        async (code?: string) => {
            const pricing = await getSubscriptionPricing({
                userId: id,
                userType: role,
                packageId: Number(payload?.packageId),
                billingType:
                    String(payload?.subscriptionDuration).toUpperCase() === 'ANNUALLY' ? 'ANNUALLY' : 'MONTHLY',
                couponCode: code,
            });
            if (!pricing) return false;
            dispatch(
                setPaymentData({
                    ...paymentState,
                    couponDiscount: pricing.couponDiscount,
                    totalAmount: pricing.expectedPaymentAmount,
                    paymentSummary: buildPricingSummary(pricing),
                })
            );
            return pricing;
        },
        [dispatch, id, paymentState, payload, role]
    );

    // remove coupon discount when page intial loading
    useEffect(() => {
        if (payload?.isEcommerceSubscription) {
            if (couponDiscount) repriceEcommerce();
            return;
        }
        const updatedPaymentSummary = (paymentState?.paymentSummary || []).filter(
            item => item.key !== 'Coupon Discount'
        );
        dispatch(
            setPaymentData({
                ...paymentState,
                totalAmount: totalAmount + (couponDiscount || 0),
                paymentSummary: updatedPaymentSummary,
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyCoupon = useCallback(
        async (
            code: string,
            setSubmitting: (isSubmitting: boolean) => void,
            defaultGatewayMode?: PaymentMode
        ) => {
            if (!payload?.accessKey) {
                dispatch(
                    showToast({
                        description: 'Coupons are not available for this service',
                        variant: 'warning',
                    })
                );
                return;
            }
            const applyCouponPayload: any = {
                userId: id,
                userType: role,
                amount: totalAmount,
                couponCode: code,
            };
            if (
                payload.accessKey === 'accounting' ||
                payload.accessKey === 'whatsApp_for_busines' ||
                payload.accessKey === accessKeys.ecommerceStore
            ) {
                applyCouponPayload.packageId = payload.packageId!;
                applyCouponPayload.billingType = payload?.subscriptionDuration!.toString()!;
            } else {
                applyCouponPayload.accessKey = payload.accessKey!;
            }
            setSubmitting(true);
            const data: ApplyCouponResponse | false = await postApplyCoupon(applyCouponPayload);
            if (data) {
                setCouponCode(code);
                const fallbackGatewayMode =
                    defaultGatewayMode ??
                    (isCCavenueService(payload?.accessKey)
                        ? PaymentMode.CCAVENUE
                        : PaymentMode.PAYTM);
                setselectedPayment(current =>
                    COUPON_GATEWAY_MODES.includes(current) ? current : fallbackGatewayMode
                );
                setIsCashbackChecked(false);
                setIsCouponApplied(true);
                setIsLoading(false);
                if (payload.isEcommerceSubscription) {
                    const pricing = await repriceEcommerce(code);
                    if (!pricing || !pricing.couponDiscount) {
                        setIsCouponApplied(false);
                        setCouponCode('');
                        dispatch(
                            showToast({
                                description: 'This coupon cannot be applied to the selected plan',
                                variant: 'error',
                            })
                        );
                    }
                    setSubmitting(false);
                    return;
                }
                let formatedDiscount = formatNumberWithLocalString(data.discountAmount);
                formatedDiscount = formatedDiscount.replace(/,/g, ''); // remove commas (1,000.00 -> 1000.00)

                const updatedPaymentSummary = [
                    ...(paymentState?.paymentSummary || []), // Ensure it's an array and create a copy
                    {
                        key: 'Coupon Discount',
                        value: `₹ ${formatNumberWithLocalString(formatedDiscount)}`,
                    },
                ];
                // setTotalAmountBeforeCoupon(totalAmount);

                dispatch(
                    setPaymentData({
                        ...paymentState,
                        couponDiscount: roundMoney(Number(data.discountAmount)),
                        totalAmount: roundMoney(totalAmount - Number(formatedDiscount)),
                        paymentSummary: updatedPaymentSummary,
                        // billSummary: updatedBillSummary,
                    })
                );
            } else {
                setCouponCode('');
            }
            setSubmitting(false);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [payload, id, role, totalAmount, dispatch, paymentState, selectedPayment, repriceEcommerce]
    );

    const removeCoupon = useCallback(() => {
        couponFormikRef?.current?.resetForm();
        setCouponCode('');
        setIsCouponApplied(false);
        if (payload?.isEcommerceSubscription) {
            repriceEcommerce();
            return;
        }
        const updatedPaymentSummary = (paymentState?.paymentSummary || []).filter(
            item => item.key !== 'Coupon Discount'
        );
        dispatch(
            setPaymentData({
                ...paymentState,
                couponDiscount: 0,
                totalAmount: totalAmount + (couponDiscount || 0),
                paymentSummary: updatedPaymentSummary,
            })
        );
    }, [dispatch, paymentState, couponDiscount, totalAmount, payload, repriceEcommerce]);

    const handleWalletPaymentRequest = async () => {
        if (!checkPayableAmount()) {
            return;
        }
        setIsLoading(true);
        // const isAgencyBalanceSufficient = await checkAgencyBalance(
        //     payload?.accessKey,
        //     payload?.amount
        // );
        // if (!isAgencyBalanceSufficient) {
        //     // show error and redirect
        //     setIsLoading(false);
        //     return;
        // }

        if (url) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { accessKey: _accessKey, ...payloadWithoutAccessKey } = payload ?? {};
            const payloadToSend = url.includes('domain-and-hosting')
                ? payloadWithoutAccessKey
                : payload;
            const serviceName = billSummary.find(item => item.key === 'Service name')?.value;

            const requestBody = {
                ...payloadToSend,
                userId: id,
                userType: role,
                url,
                currentUrl: undefined,
            };
            if (typeof Moengage?.track_event === 'function') {
                Moengage.track_event('payment_attempted', {
                    service_name: serviceName || 'N/A',
                    amount: totalAmount,
                });
            }

            if (
                typeof Moengage?.track_event === 'function' &&
                serviceDetails &&
                !excludedFromCheckoutEvent
            ) {
                const request = JSON.parse(serviceDetails);
                const { moengage_prefix, ...checkoutData } = request.serviceDetails ?? {};
                const moengageServiceName = moengage_prefix || getMoengageServiceName(serviceName);
                Moengage.track_event(`${moengageServiceName}_checkout`, {
                    mode: selectedPayment,
                    ...checkoutData,
                    coupon_code_used: isCouponApplied,
                    ...(isCouponApplied && { coupon_code_used: couponCode }),
                    total_amount: totalAmount,
                });
                sessionStorage.removeItem('service_details');
                sessionStorage.setItem(
                    'paymentResult',
                    JSON.stringify({
                        total_amount: totalAmount,
                        coupon_code_used: isCouponApplied,
                        serviceName: moengageServiceName,
                    })
                );
            }
            let failureState: PaymentFailureState = {};
            const resp: PaymentResponse | false = await doWalletPayment(requestBody, error => {
                failureState = {
                    responseCode: error?.responseCode,
                    errorMessage: error?.message,
                };
            });
            setIsLoading(false);
            if (resp && resp.bulkPaymentData) {
                if (resp.corporateFinalBalance) {
                    dispatch(
                        setUserInfo({ user: { ...user!, balance: resp.corporateFinalBalance } })
                    );
                }
                const bulkPaymentDataString = encodeURIComponent(
                    JSON.stringify(resp.bulkPaymentData)
                );
                const isEsim =
                    payload?.accessKey === accessKeys.eSim ||
                    payload?.accessKey === accessKeys.eSimTunz ||
                    Array.isArray(payload?.orderGroups);
                const query = `?status=success&bulkPaymentData=${bulkPaymentDataString || ''}${isEsim ? '&serviceName=esim' : ''}`;
                navigate(`${navSuccess}${query}`);
            } else if (resp) {
                if (resp.pending || resp.processing) {
                    const { firstBtnText, firstBtnLink } = findButtonTextAndLink(
                        payload?.accessKey
                    );
                    navigate(navPending, {
                        state: {
                            ...resp.details,
                            corporateTxnId: resp.corporateTxnId,
                            accessKey: payload?.accessKey,
                            successUrl: resp.successUrl,
                            firstBtnText,
                            firstBtnLink,
                        },
                    });
                    return;
                }
                if (url?.includes('softwaresV2')) {
                    navigate(paths.payments.subscriptionPending, {
                        state: { transactionId: resp.corporateTxnId },
                    });
                    return;
                }
                dispatch(setUserInfo({ user: { ...user!, balance: resp.corporateFinalBalance } }));
                if (payload?.accessKey === accessKeys.visa) {
                    const orderNumber =
                        resp?.orderNumber ?? resp?.order_number ?? (payload as any).orderNumber;
                    if (orderNumber) dispatch(setVisaOrderNumber(orderNumber));
                    navigate(
                        `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.visaSuccess}`,
                        { state: { orderNumber } }
                    );
                    return;
                }
                const query = `?status=success&transactionId=${resp.corporateTxnId || ''}`;
                if (successPath) {
                    navigate(successPath + query);
                } else {
                    navigate(`${navSuccess}${query}`);
                }
            } else {
                // doWalletPayment returned false — the request actually failed
                // (thrown/non-2xx). Previously visa treated this as a silent
                // success, which hid real backend errors; now it's created at
                // payment time, so failures here are real and must surface.
                navigate(navFailure, { state: failureState });
            }
        }
    };

    // Where the engine lands after any gateway's /complete — shared by Cashfree and Razorpay.
    // `orderId` (= corporateTxnId) backs the pending page's poll when the reply omits it.
    const resolveCompleteResult = (res: PaymentResponse | false, orderId?: number | string) => {
        if (!res) {
            navigate(navFailure);
            return;
        }
        setIsSpinnerLoading(false);
        if (res.corporateFinalBalance != null) {
            dispatch(setUserInfo({ user: { ...user!, balance: res.corporateFinalBalance } }));
        }
        if (res.failed) {
            navigate(navFailure, {
                state: {
                    responseCode: res.responseCode,
                    errorMessage: res.failureMessage ?? res.details?.message,
                },
            });
            return;
        }
        if (res.pending || res.processing) {
            const { firstBtnText, firstBtnLink } = findButtonTextAndLink(payload?.accessKey);
            navigate(navPending, {
                state: {
                    ...res.details,
                    corporateTxnId: res.corporateTxnId ?? orderId,
                    accessKey: payload?.accessKey,
                    successUrl: res.successUrl,
                    firstBtnText,
                    firstBtnLink,
                },
            });
            return;
        }
        if (url?.includes('softwaresV2')) {
            navigate(paths.payments.subscriptionPending, {
                state: { transactionId: res.corporateTxnId },
            });
            return;
        }
        let query = '';
        if (res.bulkPaymentData) {
            const bulkPaymentDataString = encodeURIComponent(JSON.stringify(res.bulkPaymentData));
            const isEsim =
                payload?.accessKey === accessKeys.eSim ||
                payload?.accessKey === accessKeys.eSimTunz ||
                Array.isArray(payload?.orderGroups);
            query = `?status=success&bulkPaymentData=${bulkPaymentDataString || ''}${isEsim ? '&serviceName=esim' : ''}`;
        } else {
            query = `?status=success&transactionId=${res.corporateTxnId || ''}`;
        }
        if (payload?.accessKey === accessKeys.visa) {
            const orderNumber =
                (res as any)?.orderNumber ?? (res as any)?.order_number ?? (payload as any).orderNumber;
            if (orderNumber) dispatch(setVisaOrderNumber(orderNumber));
            navigate(`${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.visaSuccess}`, {
                state: { orderNumber },
            });
        } else if (successPath) {
            navigate(successPath + query);
        } else if (res.successUrl) {
            navigate(res.successUrl + query);
        } else {
            navigate(`${navSuccess}${query}`);
        }
    };

    const handleRazorpayPaymentRequest = async (requestBody: Record<string, any>) => {
        const resp = await createRazorpayOrder(requestBody as any);
        if (!resp || !resp.status || !resp.data?.razorpayOrderId) {
            if (!(resp && resp.message)) {
                dispatch(
                    showToast({
                        description: 'Something went wrong. Please try after some time',
                        variant: 'error',
                    })
                );
            }
            setIsLoading(false);
            setIsSpinnerLoading(false);
            return;
        }
        const order = resp.data;
        if (!(await loadRazorpayScript())) {
            console.error('[Razorpay] checkout script failed to load');
            dispatch(
                showToast({
                    description: 'Unable to start the payment. Please try again.',
                    variant: 'error',
                })
            );
            setIsLoading(false);
            setIsSpinnerLoading(false);
            return;
        }

        const serviceName = billSummary.find(item => item.key === 'Service name')?.value;
        const result = await openRazorpayCheckout({
            keyId: order.keyId,
            amount: order.amount,
            currency: order.currency,
            razorpayOrderId: order.razorpayOrderId,
            description: serviceName ? String(serviceName) : undefined,
            prefill: order.prefill,
            notes: { paymentRefId: String(order.orderId) },
            onFailed: error => console.error('[Razorpay] payment attempt failed', error),
        });
        if ('error' in result) {
            console.error('[Razorpay] checkout could not open', result.error);
            dispatch(
                showToast({
                    description: 'Unable to start the payment. Please try again.',
                    variant: 'error',
                })
            );
            setIsSpinnerLoading(false);
            setIsLoading(false);
            return;
        }
        if ('dismissed' in result) {
            // Same as the Cashfree close-icon path: stay on the page, let the user retry.
            setIsSpinnerLoading(false);
            setIsLoading(false);
            return;
        }

        setIsSpinnerLoading(true);
        const pgArgs = { userId: id, userType: role, ORDERID: order.orderId, ...result.success };
        const pgPromise =
            payload?.accessKey === accessKeys.visa
                ? retryIfPending(() => completeRazorpayPayment(pgArgs), 12, 2000)
                : completeRazorpayPayment(pgArgs);
        pgPromise.then(res => resolveCompleteResult(res, order.orderId));
        setIsLoading(false);
    };

    // Corporate card: the gateway order body in one call. No coupon and no wallet top-up on this leg, so the
    // card pays the whole total. A decline is a 200 with data.declined and lands on the failure page with the
    // card's own reason.
    const handleCorporateCardPaymentRequest = async () => {
        if (!checkPayableAmount()) {
            return;
        }
        setIsLoading(true);
        const serviceName = billSummary.find(item => item.key === 'Service name')?.value;
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('payment_attempted', {
                service_name: serviceName || 'N/A',
                amount: totalAmount,
            });
        }
        const requestBody = {
            ...payload,
            pgAmount: totalAmount,
            userId: id,
            userType: role,
            couponCode: '',
            ...(payload?.accessKey === accessKeys.airline && {
                searchInitiatedAt: searchInitiatedAt || null,
            }),
        };
        let failureState: PaymentFailureState = {};
        const resp: PaymentResponse | false = await doCorporateCardPayment(requestBody, error => {
            failureState = {
                responseCode: error?.responseCode,
                errorMessage: error?.message,
            };
        });
        setIsLoading(false);
        if (!resp) {
            navigate(navFailure, { state: failureState });
            return;
        }
        if (resp.declined) {
            navigate(navFailure, {
                state: {
                    errorMessage: resp.reason || 'Card payment was not completed.',
                    showReason: true,
                },
            });
            return;
        }
        if (resp.pending || resp.processing) {
            const { firstBtnText, firstBtnLink } = findButtonTextAndLink(payload?.accessKey);
            navigate(navPending, {
                state: { ...resp.details, firstBtnText, firstBtnLink },
            });
            return;
        }
        if (resp.corporateFinalBalance) {
            dispatch(setUserInfo({ user: { ...user!, balance: resp.corporateFinalBalance } }));
        }
        const query = `?status=success&transactionId=${resp.corporateTxnId || ''}`;
        navigate(successPath ? successPath + query : `${navSuccess}${query}`);
    };

    const handlePaytmPaymentRequest = async ({
        isChecked,
        balance,
        gateway,
    }: {
        isChecked: boolean;
        balance: number;
        // serviceOperators.pgGateway via payment-methods; undefined keeps Cashfree
        gateway?: GatewayProviderCode | null;
    }) => {
        if (!checkPayableAmount()) {
            return;
        }
        setIsLoading(true);

        // const isAgencyBalanceSufficient = await checkAgencyBalance(
        //     payload?.accessKey,
        //     payload?.outbount?.amount
        // );
        // if (!isAgencyBalanceSufficient) {
        //     // show error and redirect
        //     setIsLoading(false);
        //     return;
        // }

        setIsSpinnerLoading(true);
        const AmountAfterWallet = totalAmount && totalAmount - balance;
        const pgAmount = isChecked ? AmountAfterWallet : totalAmount;

        const serviceName = billSummary.find(item => item.key === 'Service name')?.value;
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('payment_attempted', {
                service_name: serviceName || 'N/A',
                amount: pgAmount,
            });
        }
        if (
            typeof Moengage?.track_event === 'function' &&
            serviceDetails &&
            !excludedFromCheckoutEvent
        ) {
            const request = JSON.parse(serviceDetails);
            const { moengage_prefix, ...checkoutData } = request.serviceDetails ?? {};
            const moengageServiceName = moengage_prefix || getMoengageServiceName(serviceName);
            Moengage.track_event(`${moengageServiceName}_checkout`, {
                mode: selectedPayment,
                ...checkoutData,
                coupon_code_used: isCouponApplied,
                ...(isCouponApplied && { coupon_code_used: couponCode }),
                total_amount: totalAmount,
            });
            sessionStorage.removeItem('service_details');
            sessionStorage.setItem(
                'paymentResult',
                JSON.stringify({
                    total_amount: totalAmount,
                    coupon_code_used: isCouponApplied,
                    serviceName: moengageServiceName,
                })
            );
        }

        const requestBody = {
            ...payload,
            pgAmount,
            userId: id,
            userType: role,
            couponCode: isCouponApplied ? couponCode : '',
            // Add timer information for airline bookings
            ...(payload?.accessKey === accessKeys.airline && {
                searchInitiatedAt: searchInitiatedAt || null,
            }),
        };

        if (payload?.isWhatsAppSubscription) {
            const waResp = await createSubscriptionOrderFromPayments({
                ...requestBody,
                pgAmount: totalAmount,
            });
            if (!waResp || !waResp.status) {
                dispatch(
                    showToast({
                        description:
                            (waResp as any)?.message ||
                            'Something went wrong. Please try after some time',
                        variant: 'error',
                    })
                );
                setIsLoading(false);
                setIsSpinnerLoading(false);
                return;
            }
            if (checkoutJsInstance) {
                sessionStorage.setItem(
                    PLAN_DETAILS_SESSION_KEY,
                    JSON.stringify({
                        service: 'WhatsApp For Business',
                        url: `${window.location.origin}${paths.dashboard.whatsappForBusiness}`,
                        selectedType: String(
                            (payload as any)?.subscriptionDuration ?? 'monthly'
                        ).toLowerCase(),
                        isAddOns: false,
                    })
                );
                checkoutJsInstance
                    .subscriptionsCheckout({ subsSessionId: waResp.data?.session_id })
                    .then((result: any) => {
                        if (result?.error) {
                            dispatch(
                                showToast({
                                    description: 'Something went wrong. Please try after some time',
                                    variant: 'error',
                                })
                            );
                            setIsLoading(false);
                            setIsSpinnerLoading(false);
                        }
                    });
            } else {
                dispatch(
                    showToast({
                        description:
                            'Payment gateway is not ready. Please refresh the page and try again.',
                        variant: 'error',
                    })
                );
                setIsLoading(false);
                setIsSpinnerLoading(false);
            }
            return;
        }

        if (payload?.isEcommerceSubscription) {
            const ecomResp = await createSubscriptionOrderFromPayments({
                ...requestBody,
                amount: totalAmount,
                pgAmount: totalAmount,
            });
            if (!ecomResp || !ecomResp.status) {
                dispatch(
                    showToast({
                        description:
                            (ecomResp as any)?.message ||
                            'Something went wrong. Please try after some time',
                        variant: 'error',
                    })
                );
                setIsLoading(false);
                setIsSpinnerLoading(false);
                return;
            }
            if (checkoutJsInstance) {
                sessionStorage.setItem(
                    PLAN_DETAILS_SESSION_KEY,
                    JSON.stringify({
                        service: 'Peko Commerce',
                        url: `${window.location.origin}${paths.dashboard.ecommerce}`,
                        selectedType: String(
                            (payload as any)?.subscriptionDuration ?? 'monthly'
                        ).toLowerCase(),
                        isAddOns: false,
                    })
                );
                checkoutJsInstance
                    .subscriptionsCheckout({ subsSessionId: ecomResp.data?.session_id })
                    .then((result: any) => {
                        if (result?.error) {
                            dispatch(
                                showToast({
                                    description: 'Something went wrong. Please try after some time',
                                    variant: 'error',
                                })
                            );
                            setIsLoading(false);
                            setIsSpinnerLoading(false);
                        }
                    });
            } else {
                dispatch(
                    showToast({
                        description:
                            'Payment gateway is not ready. Please refresh the page and try again.',
                        variant: 'error',
                    })
                );
                setIsLoading(false);
                setIsSpinnerLoading(false);
            }
            return;
        }

        // CCAvenue services never move, whatever the admin rows say.
        if (gateway === 'RAZORPAY' && !isCCavenueService(payload?.accessKey)) {
            await handleRazorpayPaymentRequest(requestBody);
            return;
        }

        const resp = await createPGTransaction(requestBody);

        if (resp && resp.status === false) {
            if (!resp.message) {
                dispatch(
                    showToast({
                        description: 'Something went wrong. Please try after some time',
                        variant: 'error',
                    })
                );
            }
            setIsLoading(false);
            setIsSpinnerLoading(false);
            return;
        }
        if (resp && resp.status) {
            // Validate the session_id BEFORE opening the SDK modal. If the backend
            // returned status:true but no session_id (mis-shaped response, wallet-
            // only flow, downstream provider failure), Cashfree would otherwise
            // open its modal and surface its own raw error string to the user.
            const sessionId = resp.data?.session_id;
            if (typeof sessionId !== 'string' || sessionId.trim() === '') {
                console.error('[Cashfree] create-order returned without a valid session_id', {
                    respKeys: resp?.data ? Object.keys(resp.data) : null,
                    orderId: resp?.data?.orderId,
                });
                dispatch(
                    showToast({
                        description: 'Unable to start the payment. Please try again.',
                        variant: 'error',
                    })
                );
                setIsLoading(false);
                setIsSpinnerLoading(false);
                return;
            }

            // Ensure the SDK is loaded before calling checkout — earlier code
            // fired loadCheckoutScript() without awaiting, so on the first click
            // `checkoutJsInstance` was still null and nothing happened, and on
            // subsequent clicks a stale instance could be used.
            const cashfree = checkoutJsInstance || (await loadCheckoutScript());
            if (!cashfree) {
                console.error('[Cashfree] SDK failed to load');
                dispatch(
                    showToast({
                        description: 'Unable to start the payment. Please try again.',
                        variant: 'error',
                    })
                );
                setIsLoading(false);
                setIsSpinnerLoading(false);
                return;
            }

            const checkoutOptions = {
                paymentSessionId: sessionId,
                redirectTarget: '_modal', // _self
            };
            cashfree.checkout(checkoutOptions).then((result: any) => {
                if (result.error) {
                    setIsSpinnerLoading(false);
                    setIsLoading(false);
                    // This will be true whenever user clicks on close icon inside the modal or any error happens during the payment
                    console.log(
                        'User has closed the popup or there is some payment error, Check for Payment Status'
                    );
                    console.log(result.error);
                    // navigate(paths.payments.paymentFailure);
                }
                if (result.redirect) {
                    setIsSpinnerLoading(false);
                    // This will be true when the payment redirection page couldnt be opened in the same window
                    // This is an exceptional case only when the page is opened inside an inAppBrowser
                    // In this case the customer will be redirected to return url once payment is completed
                    console.log('Payment will be redirected');
                    navigate(navFailure);
                }
                if (result.paymentDetails) {
                    setIsSpinnerLoading(true);
                    // This will be called whenever the payment is completed irrespective of transaction status
                    console.log('Payment has been completed, Check for Payment Status');
                    const pgArgs = { userId: id, userType: role, ORDERID: resp.data.orderId };
                    // Visa order creation involves a vendor API call plus a
                    // per-applicant document upload to S3, which can run well
                    // past the default retry budget — give it up to ~24s.
                    const pgPromise =
                        payload?.accessKey === accessKeys.visa
                            ? retryIfPending(() => completePGPayment(pgArgs), 12, 2000)
                            : completePGPayment(pgArgs);
                    pgPromise.then(res => resolveCompleteResult(res, resp.data.orderId));
                    setIsLoading(false);
                }
            });
        } else {
            dispatch(
                showToast({
                    description: 'Something went wrong. Please try after some time',
                    variant: 'error',
                })
            );
            setIsLoading(false);
            setIsSpinnerLoading(false);
        }
    };

    const handleCCavenuePaymentRequest = async () => {
        if (!checkPayableAmount()) return;
        setIsLoading(true);
        const serviceName = billSummary.find(item => item.key === 'Service name')?.value;
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('payment_attempted', {
                service_name: serviceName || 'N/A',
                amount: totalAmount,
            });
        }
        if (
            typeof Moengage?.track_event === 'function' &&
            serviceDetails &&
            !excludedFromCheckoutEvent
        ) {
            const request = JSON.parse(serviceDetails);
            const { moengage_prefix, ...checkoutData } = request.serviceDetails ?? {};
            const moengageServiceName = moengage_prefix || getMoengageServiceName(serviceName);
            Moengage.track_event(`${moengageServiceName}_checkout`, {
                mode: selectedPayment,
                ...checkoutData,
                coupon_code_used: isCouponApplied,
                ...(isCouponApplied && { coupon_code_used: couponCode }),
                total_amount: totalAmount,
            });
            sessionStorage.removeItem('service_details');
            sessionStorage.setItem(
                'paymentResult',
                JSON.stringify({
                    total_amount: totalAmount,
                    coupon_code_used: isCouponApplied,
                    serviceName: moengageServiceName,
                })
            );
        }
        const requestBody = {
            ...payload,
            pgAmount: totalAmount,
            userId: id,
            userType: role,
            url,
            couponCode: isCouponApplied ? couponCode : '',
        };
        const resp = await initiateCCavenuePayment(requestBody as any);
        setIsLoading(false);
        if (resp && (resp as any).iframeUrl) {
            setCCavenueUrl((resp as any).iframeUrl);
        } else if (!(resp as any)?.message) {
            dispatch(
                showToast({
                    description: 'Something went wrong. Please try after some time',
                    variant: 'error',
                })
            );
        }
    };

    const handleMswipePaymentRequest = async ({
        isChecked,
        balance,
        // gateway
    }: {
        isChecked: boolean;
        balance: number;
        // gateway?: GatewayProviderCode | null;
    }) => {
        if (!checkPayableAmount()) return;
        setIsLoading(true);
        const pgAmount = isChecked ? totalAmount && totalAmount - balance : totalAmount;
        const serviceName = billSummary.find(item => item.key === 'Service name')?.value;
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('payment_attempted', {
                service_name: serviceName || 'N/A',
                amount: pgAmount,
            });
        }
        if (
            typeof Moengage?.track_event === 'function' &&
            serviceDetails &&
            !excludedFromCheckoutEvent
        ) {
            const request = JSON.parse(serviceDetails);
            const { moengage_prefix, ...checkoutData } = request.serviceDetails ?? {};
            const moengageServiceName = moengage_prefix || getMoengageServiceName(serviceName);
            Moengage.track_event(`${moengageServiceName}_checkout`, {
                mode: selectedPayment,
                ...checkoutData,
                coupon_code_used: isCouponApplied,
                ...(isCouponApplied && { coupon_code_used: couponCode }),
                total_amount: totalAmount,
            });
            sessionStorage.removeItem('service_details');
            sessionStorage.setItem(
                'paymentResult',
                JSON.stringify({
                    total_amount: totalAmount,
                    coupon_code_used: isCouponApplied,
                    serviceName: moengageServiceName,
                })
            );
        }
        const resp = await initiateMswipePayment({
            ...payload,
            pgAmount,
            userId: id,
            userType: role,
            couponCode: isCouponApplied ? couponCode : '',
            ...(payload?.accessKey === accessKeys.airline && {
                searchInitiatedAt: searchInitiatedAt || null,
            }),
        });
        if (resp && resp.paymentUrl) {
            window.location.assign(resp.paymentUrl);
            return;
        }
        setIsLoading(false);
        if (resp) {
            dispatch(
                showToast({
                    description:
                        'Something went wrong. If the issue persists, please contact support at reach@peko.one',
                    variant: 'error',
                })
            );
        }
    };

    const loadCheckoutScript = useCallback(async () => {
        const cashfree = await load({
            mode: ENV === 'production' ? 'production' : 'sandbox',
        });
        setCheckoutJsInstance(cashfree);
        return cashfree;
    }, [setCheckoutJsInstance]);

    function checkPayableAmount() {
        if (Number(payload?.amount!) <= 0) {
            dispatch(
                showToast({
                    description: 'Please enter a valid amount',
                    variant: 'warning',
                })
            );
            return false;
        }
        const boundMessage = formatAmountBoundError(
            payload?.amount ?? 0,
            minimumAmount,
            maximumAmount
        );
        if (boundMessage) {
            dispatch(showToast({ description: boundMessage, variant: 'warning' }));
            return false;
        }
        return true;
    }

    // not working (plural gateway)
    const handleCardPaymentRequest = async ({
        isChecked,
        balance,
    }: {
        isChecked: boolean;
        balance: number;
    }) => {
        if (!checkPayableAmount()) {
            return;
        }
        setIsLoading(true);

        const pgAfterWallet = totalAmount && totalAmount - balance;
        const pgAmount = isChecked ? pgAfterWallet : totalAmount;

        const serviceName = billSummary.find(item => item.key === 'Service name')?.value;
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('payment_attempted', {
                service_name: serviceName || 'N/A',
                amount: pgAmount,
            });
        }
        if (
            typeof Moengage?.track_event === 'function' &&
            serviceDetails &&
            !excludedFromCheckoutEvent
        ) {
            const request = JSON.parse(serviceDetails);
            const { moengage_prefix, ...checkoutData } = request.serviceDetails ?? {};
            const moengageServiceName = moengage_prefix || getMoengageServiceName(serviceName);
            Moengage.track_event(`${moengageServiceName}_checkout`, {
                mode: selectedPayment,
                ...checkoutData,
                coupon_code_used: isCouponApplied,
                ...(isCouponApplied && { coupon_code_used: couponCode }),
                total_amount: pgAmount,
            });
            sessionStorage.removeItem('service_details');
            sessionStorage.setItem(
                'paymentResult',
                JSON.stringify({
                    total_amount: pgAmount,
                    coupon_code_used: isCouponApplied,
                    serviceName: moengageServiceName,
                })
            );
        }

        const requestBody = {
            ...payload,
            pgAmount,
            userId: id,
            userType: role,
            successUrl: PAYMENT_SUCCESS_URL,
            failureUrl: PAYMENT_FAiLURE_URL,
            // Add timer information for airline bookings
            ...(payload?.accessKey === accessKeys.airline && {
                searchInitiatedAt: searchInitiatedAt || null,
            }),
        };
        const resp: CardPaymentResponse | false = await createPaymentLink(requestBody);
        if (resp) {
            if (successPath) {
                sessionStorage.setItem('cardPaymentSuccessPath', successPath);
            }
            window.location.href = resp.redirectLink;
            return;
        }
        setIsLoading(false);
    };

    // const checkAgencyBalance = async (accessKey?: string, amount?: string | number) => {
    //     if (accessKey === 'tbo_airline' && amount) {
    //         const res = await checkAgencyBalanceApi({
    //             userId: id,
    //             userType: role,
    //             amount,
    //         });
    //         return res;
    //     }
    //     return true;
    // };

    const findButtonTextAndLink = (accessKey?: string) => {
        switch (accessKey) {
            case accessKeys.airline:
                return {
                    firstBtnText: 'Go to Manage Bookings',
                    firstBtnLink: `${paths.dashboard.corporateTravel}/${paths.airline.index}/${paths.airline.manage}`,
                };
            case accessKeys.prepaid:
                return {
                    firstBtnText: 'Go to Mobile Recharge',
                    firstBtnLink: `/mobile-recharge-&-bills`,
                };
            case accessKeys.eSim:
            case accessKeys.eSimTunz:
                return {
                    firstBtnText: 'Install eSIM',
                    firstBtnLink: '/corporate-travel/eSIM/orders/package-details',
                };
            case accessKeys.corporateCards:
                return {
                    firstBtnText: 'Go to Corporate Cards',
                    firstBtnLink: `/${paths.dashboard.corporateCard}`,
                };
            case accessKeys.giftCards:
            case accessKeys.xoxoday:
                return {
                    firstBtnText: 'Go to Gift Cards',
                    firstBtnLink: `/${paths.giftcards.index}`,
                };
            case accessKeys.shipmentServices:
                return {
                    firstBtnText: 'Go to Order History',
                    firstBtnLink: `/${paths.logistics.index}/${paths.logistics.orderHistory}`,
                };
            default:
                return {
                    firstBtnText: 'Go to Utility Payments',
                    firstBtnLink: '/utility-payments',
                };
        }
    };

    return {
        selectedPayment,
        setselectedPayment,
        isCashbackChecked,
        setIsCashbackChecked,
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
        isCouponApplied,
        applyCoupon,
        couponCode,
        setCouponCode,
        removeCoupon,
    };
}
