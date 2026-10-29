import { useCallback, useState } from 'react';

import { capitalize } from 'lodash';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';

import GetSurcharge from './useSurcharge';
import { setPaymentData } from '../../payments/slices/payment';
import { PlanType } from '../../plans/types';

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

// Peko POS is a one-time purchase: the payload carries no `is*Subscription`
// flag, which is what routes it to the plain Cashfree order + modal checkout
// instead of the mandate/AutoPay flow.
export default function usePayment() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { getSurchargeData } = GetSurcharge();
    const path =
        window.location.href.toLocaleLowerCase()?.split('/plan-details')[0] || window.location.href;
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmission = useCallback(
        async (
            plan: string,
            duration: PlanType,
            planId: number,
            planPrice: string | number,
            discount: string | number = 0
        ) => {
            try {
                setIsLoading(true);

                const planPriceNumber = parseFloat(`${planPrice}`) || 0;
                const discountNumber = parseFloat(`${discount}`) || 0;
                const originalNumber = planPriceNumber + discountNumber;
                const amount = `${planPriceNumber}`;

                const surchargeData = await getSurchargeData(amount);
                const surcharge = surchargeData?.surcharge
                    ? parseFloat(surchargeData.surcharge)
                    : 0;
                const total = planPriceNumber + surcharge;

                const billSummary = [
                    { key: 'Service name', value: 'Peko POS' },
                    { key: 'Plan name', value: plan },
                    { key: 'Billing cycle', value: capitalize(duration) },
                    {
                        key: 'Plan price',
                        value: `₹ ${formatNumber(discountNumber > 0 ? originalNumber : planPriceNumber)}`,
                    },
                    ...(discountNumber > 0
                        ? [{ key: 'Discount', value: `- ₹ ${formatNumber(discountNumber)}` }]
                        : []),
                    { key: 'Amount', value: formatNumber(planPriceNumber) },
                ];

                const paymentSummary = [
                    { key: 'Platform fee (inclusive of GST)', value: formatNumber(surcharge) },
                ];

                const requestBody = {
                    amount,
                    pgAmount: amount,
                    subscriptionPlan: plan,
                    subscriptionDuration: duration,
                    packageId: planId,
                    accessKey: accessKeys.pekoPos,
                    currentUrl: path,
                    successUrl: paths.dashboard.pekoPos,
                    isPosPurchase: true,
                    planPrice: planPriceNumber,
                    discount: discountNumber,
                };

                dispatch(
                    setPaymentData({
                        billSummary,
                        paymentSummary,
                        totalAmount: total,
                        title: 'Bill Summary',
                        payload: requestBody,
                        url: '',
                        successPath: `${paths.dashboard.pekoPos}/${paths.pekoPos.paymentsuccess}`,
                        earningCashbackAmount: Number(surchargeData?.corporateCashback) || 0,
                    })
                );

                navigate(paths.dashboard.payments);
            } catch (error) {
                console.error('Error in handleSubmission:', error);
            } finally {
                setIsLoading(false);
            }
        },
        [getSurchargeData, path, dispatch, navigate]
    );

    return { handleSubmission, isLoading };
}
