import { useCallback, useState } from 'react';

import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';

import { setPaymentData } from '../../payments/slices/payment';
import { getSubscriptionPricing } from '../../plans/api';
import { buildPricingSummary } from '../../plans/utils';
import { PlanType } from '../types';

export default function usePayment() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const path =
        window.location.href.toLocaleLowerCase()?.split('/plan-details')[0] || window.location.href;
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmission = useCallback(
        async (plan: string, duration: PlanType, planId: number) => {
            try {
                setIsLoading(true);

                const pricing = await getSubscriptionPricing({
                    userId: id,
                    userType: role,
                    packageId: planId,
                    billingType: duration === PlanType.Annually ? 'ANNUALLY' : 'MONTHLY',
                });
                if (!pricing) {
                    dispatch(
                        showToast({
                            variant: 'error',
                            description: 'Unable to fetch the plan price. Please try again.',
                        })
                    );
                    return;
                }

                const {
                    packagePrice,
                    packageDiscount,
                    additionalDiscount,
                    expectedPaymentAmount,
                } = pricing;
                const total = Number(expectedPaymentAmount) || 0;

                const billSummary = [
                    { key: 'Service name', value: 'Peko Commerce' },
                    { key: 'Plan name', value: plan },
                    { key: 'Billing cycle', value: capitalize(duration) },
                ];

                const paymentSummary = buildPricingSummary(pricing);

                const requestBody = {
                    amount: `${total}`,
                    pgAmount: `${total}`,
                    subscriptionPlan: plan,
                    isSubscription: true,
                    subscriptionDuration: duration,
                    packageId: planId,
                    accessKey: accessKeys.ecommerceStore,
                    currentUrl: path,
                    successUrl: paths.dashboard.ecommerce,
                    isEcommerceSubscription: true,
                    isUpgrade: additionalDiscount > 0,
                    upgradeCredit: additionalDiscount,
                    planPrice: packagePrice,
                    discount: packageDiscount,
                };

                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Bill Summary',
                        payload: requestBody,
                        url: '',
                        successPath: `${paths.dashboard.ecommerce}/${paths.ecommerce.paymentsuccess}`,
                    })
                );

                navigate(paths.dashboard.payments);
            } catch (error) {
                console.error('Error in handleSubmission:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [id, role, path, dispatch, navigate]
    );

    return { handleSubmission, isLoading };
}
