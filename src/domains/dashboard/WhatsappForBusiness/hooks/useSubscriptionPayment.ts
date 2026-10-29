import { useCallback, useState } from 'react';

import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useCheckProjectExist from './useCheckProjectExist';
import GetSurcharge from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';
import { resetWhatsappBusinessState } from '../slices/paymentSlice';
import { PlanMode, PlanType } from '../types/index';
import { WHATSAPP_DEMO_EMAIL } from '../utils/index';

export default function useWhatsAppSubscriptionPayment() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const isDemoAccount =
        useAppSelector(
            state => state.reducer.user?.user?.email?.toLowerCase() === WHATSAPP_DEMO_EMAIL
        ) === true;
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { getSurchargeData } = GetSurcharge();
    const { checkProject } = useCheckProjectExist();

    // State to manage the overall loading state
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmission = useCallback(
        async (
            plan: PlanMode | string,
            duration: PlanType | string,
            planId: number,
            discountedAmount: number,
            botBuilderValue: number,
            subscription: any,
            deduction: number | null,
            isRenewal: boolean = false,
            shopifyValue: number = 0
        ) => {
            try {
                // Set loading to true when starting the process
                setIsLoading(true);

                // Use the checkProject function to determine if the project exists
                const projectPayload = {
                    userId: id,
                    userType: role,
                };

                // Wait for the checkProject to complete (skipped for the demo account, which has no business profile)
                const isExist = isDemoAccount ? false : await checkProject(projectPayload);

                // Only proceed if the project exists
                if (isExist) {
                    console.error('Project does not exist');
                    return;
                }

                const amount = `${discountedAmount}`;
                const subtotal =
                    (amount ? parseFloat(amount) : 0) +
                    (botBuilderValue ? parseFloat(botBuilderValue.toString()) : 0) +
                    (shopifyValue ? parseFloat(shopifyValue.toString()) : 0);
                const payableBeforeFee =
                    subtotal - (deduction ? parseFloat(deduction.toString()) : 0);
                const requestAmount = `${Number(Math.max(0, payableBeforeFee).toFixed(2))}`;
                const surchargeData = await getSurchargeData(requestAmount);

                const total =
                    payableBeforeFee +
                    (surchargeData?.surcharge ? parseFloat(surchargeData.surcharge) : 0);

                const billSummary = [
                    { key: 'Service name', value: 'WhatsApp for Business' },
                    { key: 'Plan name', value: plan },
                    { key: 'Billing cycle', value: capitalize(duration) },
                    ...(botBuilderValue > 0
                        ? [
                              {
                                  key: 'Add on (Bot Builder)',
                                  value: `₹ ${new Intl.NumberFormat('en-IN', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                  }).format(Number(botBuilderValue))}`,
                              },
                          ]
                        : []),
                    ...(shopifyValue > 0
                        ? [
                              {
                                  key: 'Add on (Shopify Integration)',
                                  value: `₹ ${new Intl.NumberFormat('en-IN', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                  }).format(Number(shopifyValue))}`,
                              },
                          ]
                        : []),
                    {
                        key: 'Plan amount',
                        value: new Intl.NumberFormat('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }).format(Number(amount) ?? 0),
                    },
                ];

                const paymentSummary = [
                    { key: 'Subtotal', value: `₹ ${formatNumberWithLocalString(subtotal)}` },
                    ...(deduction
                        ? [
                              {
                                  key: 'Remaining Period Credit',
                                  value: `₹ ${formatNumberWithLocalString(deduction)}`,
                              },
                          ]
                        : []),
                    {
                        key: 'Platform fee (inclusive of GST)',
                        value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
                    },
                ];

                // Backend splits pgAmount into the plan row (pgAmount - botBuilder - shopifyIntegration)
                // and separate add-on rows, so pgAmount must be the plan + add-ons total. Sending
                // plan-only made subscriptionAmountPaid go negative when the (yearly) add-on cost
                // exceeded the discounted annual plan price.
                const pgAmount = `${parseFloat(amount) + (botBuilderValue > 0 ? Number(botBuilderValue) : 0) + (shopifyValue > 0 ? Number(shopifyValue) : 0)}`;

                const requestBody = {
                    amount: requestAmount,
                    pgAmount,
                    ...(botBuilderValue > 0 && { botBuilder: botBuilderValue }),
                    ...(shopifyValue > 0 && { shopifyIntegration: shopifyValue }),
                    subscriptionPlan: plan,
                    isSubscription: true,
                    ...(subscription && !isRenewal && { isUpgrade: true }),
                    ...(subscription && isRenewal && { isRenewal: true }),
                    ...(subscription && { projectId: subscription.projectId }),
                    subscriptionDuration: duration,
                    packageId: planId,
                    accessKey: accessKeys.whatsappBasic,
                    currentUrl: window.location.href,
                    successUrl: `${paths.dashboard.whatsappForBusiness}/${paths.whatsappForBusiness.paymentsuccess}`,
                    isWhatsAppSubscription: true,
                };

                // Dispatch the payment data to the store
                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Bill Summary',
                        payload: requestBody,
                        url: '',
                        earningCashbackAmount: Number(surchargeData?.corporateCashback) || 0,
                    })
                );

                // Feeds the generic checkout mechanism in payments/hooks/usePaymentApi.ts (it runs
                // before that hook's isWhatsAppSubscription branch takes over). moengage_prefix
                // overrides SERVICE_NAME_MAP's 'WhatsApp for Business' -> 'wa' mapping, which
                // predates this event and doesn't match the whatsapp_for_business_* naming here.
                sessionStorage.setItem(
                    'service_details',
                    JSON.stringify({
                        serviceDetails: {
                            moengage_prefix: 'whatsapp_for_business',
                            whatsapp_for_business_plan: duration,
                        },
                    })
                );

                // Navigate to the payments page
                navigate(paths.dashboard.payments);

                // Reset WhatsApp business state after navigation
                dispatch(resetWhatsappBusinessState());
            } catch (error) {
                console.error('Error in handleSubmission:', error);
            } finally {
                // Reset the loading state after the process is complete
                setIsLoading(false);
            }
        },
        [dispatch, navigate, getSurchargeData, checkProject, id, role, isDemoAccount]
    );

    return { handleSubmission, isLoading };
}
