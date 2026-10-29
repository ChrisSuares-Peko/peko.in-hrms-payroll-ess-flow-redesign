import { useCallback, useEffect, useState } from 'react';

import { load } from '@cashfreepayments/cashfree-js';
import { useNavigate } from 'react-router-dom';

import { ENV } from '@src/config-global';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useUserInfo from '@src/hooks/useUserInfo';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import {
    completePaytmPayment,
    postAddonPaymentRequest,
    postPaymentRequest,
    postPaymentRequestForFree,
} from '../api/index';
import {
    AddOnPaymentRequestPayload,
    PaymentRequestPayload,
    PaytmCreateOrderResponse,
    SubscriptionPaymentMode,
} from '../types/index';

export default function usePaymentRequest() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpinnerLoading] = useState(false);
    const [checkoutJsInstance, setCheckoutJsInstance] = useState<any>(null);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { getUserServicesData } = useUserInfo();
    const [selectedPaymentMode, setselectedPaymentMode] = useState<SubscriptionPaymentMode>(
        SubscriptionPaymentMode.card
    );

    const loadCheckoutScript = useCallback(async () => {
        const cashfree = await load({
            mode: ENV === 'production' ? 'production' : 'sandbox',
        });
        setCheckoutJsInstance(cashfree);
    }, []);

    useEffect(() => {
        loadCheckoutScript();
    }, [loadCheckoutScript]);

    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                setIsLoading(false);
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    const handlePaymentRequest = async (payload: PaymentRequestPayload) => {
        setIsLoading(true);
        payload.accessKey = accessKeys.purchaseSubscription;
        payload.pgAmount = payload.amount;

        // When the coupon fully covers the subscription price, bypass the payment gateway
        // and activate the subscription directly so it doesn't depend on a webhook.
        // Mandate setup must always go through create-subscription-order.
        if (payload.amount === 0 && !payload.isMandate) {
            const resp = await postPaymentRequestForFree({
                ...payload,
                userId: id,
                userType: role,
            });
            if (resp) {
                // Hard redirect (full page load) to the success page, mirroring the Cashfree
                // return_url path. A same-tree SPA navigate here trips the dashboard ErrorBoundary
                // (-> "Service Unavailable") when the destination render or the in-place services
                // refresh throws mid-transition; a full reload boots a fresh React tree instead and
                // re-fetches services on init (so getUserServicesData is no longer needed here).
                window.location.assign(
                    `${window.location.origin}/${paths.plans.index}/${paths.plans.paymentsuccess}?status=success`
                );
                return;
            }
            dispatch(
                showToast({
                    description: 'Something went wrong. Please try after some time',
                    variant: 'error',
                })
            );
            setIsLoading(false);
            return;
        }

        if (!checkoutJsInstance) {
            dispatch(
                showToast({
                    description: 'Payment gateway is not ready. Please refresh and try again.',
                    variant: 'error',
                })
            );
            setIsLoading(false);
            return;
        }

        // One-time (non-mandate) purchase: same /create-subscription-order endpoint (backend branches on
        // isOneTime), but a plain Cashfree order + modal checkout then /complete — mirroring the add-on
        // flow — instead of the recurring subscriptionsCheckout. No mandate is set up.
        if (payload.isOneTime) {
            const oneTimeResp: false | PaytmCreateOrderResponse = await postPaymentRequest({
                ...payload,
                userId: id,
                userType: role,
            });

            if (!oneTimeResp) {
                dispatch(
                    showToast({
                        description: 'Something went wrong. Please try after some time',
                        variant: 'error',
                    })
                );
                setIsLoading(false);
                return;
            }

            checkoutJsInstance
                .checkout({ paymentSessionId: oneTimeResp.session_id, redirectTarget: '_modal' })
                .then(async (result: any) => {
                    if (result?.error) {
                        setIsLoading(false);
                        return;
                    }
                    if (result?.redirect) {
                        // Fallback when the modal can't open (in-app browsers) — Cashfree's return_url
                        // handles the post-payment redirect.
                        setIsLoading(false);
                        return;
                    }
                    if (result?.paymentDetails) {
                        const completeResp = await completePaytmPayment({
                            userId: id,
                            userType: role,
                            ORDERID: oneTimeResp.orderId,
                        });
                        setIsLoading(false);
                        if (completeResp) {
                            await getUserServicesData();
                            navigate(`/${paths.plans.index}/${paths.plans.paymentsuccess}`);
                        } else {
                            navigate(`/${paths.plans.index}/${paths.plans.paymentFailure}`);
                        }
                    }
                });
            return;
        }

        const resp: false | PaytmCreateOrderResponse = await postPaymentRequest({
            ...payload,
            userId: id,
            userType: role,
        });

        if (!resp) {
            dispatch(
                showToast({
                    description: 'Something went wrong. Please try after some time',
                    variant: 'error',
                })
            );
            setIsLoading(false);
            return;
        }

        // subscriptionsCheckout redirects the browser to Cashfree's payment page.
        // The promise resolves immediately (before the redirect completes), so navigating
        // here on "success" flashes the success page before Cashfree takes over.
        // Cashfree's return_url (set to the success page on the backend) handles the
        // post-payment redirect, so we only act on errors here.
        checkoutJsInstance
            .subscriptionsCheckout({ subsSessionId: resp.session_id })
            .then((result: any) => {
                if (result?.error) {
                    // User closed the popup or a payment error occurred — stay silent;
                    // Cashfree's return_url handles the post-payment redirect.
                    setIsLoading(false);
                }
            });
    };

    const handleAddOnPaymentRequest = async (
        payload: Pick<
            AddOnPaymentRequestPayload,
            'pgAmount' | 'addonsAccessKey' | 'packageId' | 'quantity' | 'isDynamicUnitPricing'
        >
    ) => {
        setIsLoading(true);

        if (!checkoutJsInstance) {
            dispatch(
                showToast({
                    description: 'Payment gateway is not ready. Please refresh and try again.',
                    variant: 'error',
                })
            );
            setIsLoading(false);
            return;
        }

        const resp: false | PaytmCreateOrderResponse = await postAddonPaymentRequest({
            ...payload,
            isAddOns: true,
            accessKey: accessKeys.purchaseSubscription,
            successUrl: `${window.location.origin}/${paths.plans.index}/${paths.plans.paymentsuccess}`,
            failureUrl: `${window.location.origin}/${paths.plans.index}/${paths.plans.paymentFailure}`,
            currentUrl: window.location.href,
            userId: id,
            userType: role,
        });

        if (!resp) {
            dispatch(
                showToast({
                    description: 'Something went wrong. Please try after some time',
                    variant: 'error',
                })
            );
            setIsLoading(false);
            return;
        }

        // Use modal/popup mode so the user stays on our page and the promise
        // resolves with a concrete result we can act on.
        checkoutJsInstance
            .checkout({ paymentSessionId: resp.session_id, redirectTarget: '_modal' })
            .then(async (result: any) => {
                if (result?.error) {
                    // User closed the popup or a payment error occurred — stay on page silently
                    setIsLoading(false);
                    return;
                }
                if (result?.redirect) {
                    // Fallback when the modal can't open in the same window (in-app browsers).
                    // Cashfree's return_url will handle the post-payment redirect.
                    setIsLoading(false);
                    return;
                }
                if (result?.paymentDetails) {
                    // Payment flow completed in the popup. Call /complete so the backend
                    // fetches the final payment status from Cashfree and creates the addon
                    // subscription — without this the order is never finalised.
                    const completeResp = await completePaytmPayment({
                        userId: id,
                        userType: role,
                        ORDERID: resp.orderId,
                    });
                    setIsLoading(false);
                    if (completeResp) {
                        await getUserServicesData();
                        navigate(`/${paths.plans.index}/${paths.plans.paymentsuccess}`);
                    } else {
                        navigate(`/${paths.plans.index}/${paths.plans.paymentFailure}`);
                    }
                }
            });
    };

    return {
        handlePaymentRequest,
        handleAddOnPaymentRequest,
        isLoading,
        isSpinnerLoading,
        selectedPaymentMode,
        setselectedPaymentMode,
    };
}
