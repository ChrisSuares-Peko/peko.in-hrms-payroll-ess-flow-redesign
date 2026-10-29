import { useCallback, useState } from 'react';

import { load } from '@cashfreepayments/cashfree-js';
import { useNavigate } from 'react-router-dom';

import { ENV } from '@src/config-global';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
// import { setUserInfo } from '@src/slices/userSlice';
import { setUserInfo } from '@src/slices/userSlice';
import { accessKeys } from '@utils/accessKeys';

import { completePaytmPayment, postPaymentRequest } from '../api';
import { setPaymentResponse } from '../slice/WalletSlice';
import { UsePaymentApiProps, walletPaymentMode } from '../types';

export default function usePaymentRequest({
    setCheckoutJsInstance,
    checkoutJsInstance,
}: UsePaymentApiProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpinnerLoading, setIsSpinnerLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [selectedPaymentMode, setselectedPaymentMode] = useState<walletPaymentMode>(
        walletPaymentMode.card
    );
    const handlePaymentRequest = async (payload: any) => {
        setIsLoading(true);
        payload.accessKey = accessKeys.pekoWallet;
        payload.pgAmount = payload.amount;
        if (payload.amount > 0) {
            const resp: false | any = await postPaymentRequest({
                ...payload,
                userId: id,
                userType: role,
            });
            if (resp) {
                // Validate session_id before opening the SDK modal — passing
                // undefined here makes Cashfree open the modal and then surface
                // its own raw error string ("payment_session_id is not present
                // or is invalid"). Guard so the user sees a Peko-controlled
                // message instead.
                const sessionId = resp.session_id;
                if (typeof sessionId !== 'string' || sessionId.trim() === '') {
                    console.error('[Cashfree] wallet payment: missing session_id in response', {
                        respKeys: resp ? Object.keys(resp) : null,
                        orderId: resp?.orderId,
                    });
                    dispatch(
                        showToast({
                            description: 'Unable to start the payment. Please try again.',
                            variant: 'error',
                        })
                    );
                    setIsLoading(false);
                    return;
                }

                // Ensure the SDK is loaded before calling checkout — earlier
                // code fired loadCheckoutScript() without awaiting.
                const cashfree = checkoutJsInstance || (await loadCheckoutScript());
                if (!cashfree) {
                    console.error('[Cashfree] wallet payment: SDK failed to load');
                    dispatch(
                        showToast({
                            description: 'Unable to start the payment. Please try again.',
                            variant: 'error',
                        })
                    );
                    setIsLoading(false);
                    return;
                }

                const checkoutOptions = {
                    paymentSessionId: sessionId,
                    redirectTarget: '_modal', // _self
                };
                cashfree.checkout(checkoutOptions).then(async (result: any) => {
                        if (result.error) {
                            setIsSpinnerLoading(false);
                            setIsLoading(false);
                            // navigate(
                            //     `/${paths.pekoWallet.index}/${paths.pekoWallet.paymentFailure}`
                            // );
                        }
                        if (result.redirect) {
                            setIsSpinnerLoading(false);
                            // This will be true when the payment redirection page couldnt be opened in the same window
                            // This is an exceptional case only when the page is opened inside an inAppBrowser
                            // In this case the customer will be redirected to return url once payment is completed
                            console.log('Payment will be redirected');
                            navigate(
                                `/${paths.pekoWallet.index}/${paths.pekoWallet.paymentFailure}`
                            );
                        }
                        if (result.paymentDetails) {
                            setIsSpinnerLoading(true);
                            // This will be called whenever the payment is completed irrespective of transaction status
                            console.log('Payment has been completed, Check for Payment Status');
                            setIsSpinnerLoading(true);
                            const paymentResp: any | false = await completePaytmPayment({
                                userId: id,
                                userType: role,
                                ORDERID: resp.orderId,
                            });
                            if (paymentResp) {
                                dispatch(setPaymentResponse(paymentResp));
                                dispatch(
                                    setUserInfo({
                                        user: {
                                            ...user!,
                                            balance: paymentResp.corporateFinalBalance,
                                        },
                                    })
                                );
                                setIsSpinnerLoading(false);
                                // window.location.href = payload.successUrl;
                                navigate(
                                    `/${paths.pekoWallet.index}/${paths.pekoWallet.paymentsuccess}?status=success&transactionId=${paymentResp?.corporateTxnId}`
                                );

                                // dispatch(setUserInfo({ user: { ...user!, balance: res.corporateFinalBalance } }));
                                //     const query = `status=success&transactionId=${res.corporateTxnId || ''}`;
                                //     const encodedQueryParams = btoa(query);
                                //     navigate(`${paths.payments.paymentsuccess}?${encodedQueryParams}`);
                            } else {
                                // window.location.href = payload.failureUrl;
                                navigate(
                                    `/${paths.pekoWallet.index}/${paths.pekoWallet.paymentFailure}`
                                );
                            }
                            setIsSpinnerLoading(false);
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
            }
        }
        // else {
        //     const response: false | {} = await postPaymentRequestForFree({
        //         ...payload,
        //         userId: id,
        //         userType: role,
        //     });
        //     setIsLoading(false);
        //     if (response) {
        //         navigate(`/${paths.pekoWallet.index}/${paths.pekoWallet.paymentsuccess}`);
        //     } else {
        //         navigate(`/${paths.pekoWallet.index}/${paths.pekoWallet.paymentFailure}`);
        //     }
        // }
    };

    const loadCheckoutScript = useCallback(async () => {
        const cashfree = await load({
            mode: ENV === 'production' ? 'production' : 'sandbox',
        });
        setCheckoutJsInstance(cashfree);
        return cashfree;
    }, [setCheckoutJsInstance]);

    return {
        handlePaymentRequest,
        isLoading,
        isSpinnerLoading,
        loadCheckoutScript,
        selectedPaymentMode,
        setselectedPaymentMode,
    };
}
