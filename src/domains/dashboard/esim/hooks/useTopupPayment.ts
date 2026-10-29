import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';
import { getPlanDetails } from '../api';
import { InnerPlan, MultiOrderPayload } from '../types';
import { convertMBtoGB, formatPlanName } from '../utils/helperFunction';

export default function usePayment() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id, username } = useAppSelector(state => state.reducer.auth);

    const handleSubmission = useCallback(
        async (values: MultiOrderPayload) => {
            const data = await getPlanDetails({
                userId: id,
                userType: role,
                orders: values.orders,
            });

            if (!data) {
                console.error('useTopupPayment: getPlanDetails failed or returned no data');
                return;
            }

            const { plans, subtotalAmount, totalQuantity } = data;
            const roundedAmount = Number(subtotalAmount.toFixed(2));
            const firstPlan = plans[0];
            let accessKey;

            if (firstPlan.provider === "tunz") {
                accessKey = accessKeys.eSimTunz;
              } else {
                accessKey = accessKeys.eSim;
              }
            const surchargeData = await getSurcharge({
                userId: id,
                userType: role,
                amount: roundedAmount,
                accessKey,
                quantity: totalQuantity,
            });

            const surchargeAmount =
                surchargeData && 'surcharge' in surchargeData ? Number(surchargeData.surcharge) : 0;

            const total = roundedAmount + surchargeAmount;

            const billSummary = [
                { key: 'Service name', value: 'eSIM' },
                ...plans.map((plan: InnerPlan, idx: number) => ({
                    key: `Plan ${idx + 1}`,
                    value: firstPlan.provider === "tunz" ? firstPlan.name : formatPlanName(
                        `${plan.country}_${convertMBtoGB(plan.dataMBs)}GB_${plan.periodDays}_d`
                    )
                })),
                {
                    key: 'Amount',
                    value: formatNumberWithLocalString(roundedAmount),
                },
            ];

            const paymentSummary = [
                {
                    key: 'Platform fee (inclusive of GST)',
                    value: `₹ ${formatNumberWithLocalString(surchargeAmount)}`,
                },
            ];

            const normalizedOrders = values.orders.map(o => ({
                country: o.country,
                data: o.data,
                validity: o.validity,
                quantity: o.quantity,
            }));

            // const identifier = values.orders[0].customerUid
            //     ? { customerUid: values.orders[0].customerUid } // Tunz
            //     : { iccid: values.orders[0].iccid }; // Bondio

            const requestBody = {
                amount: roundedAmount,
                quantity: totalQuantity,
                accessKey,
                account: username,
                currentUrl: window.location.href,
                orders: normalizedOrders,
                planIds: plans.map((p: InnerPlan) => p.planId),
                iccid: values.orders[0].iccid,
                type: 'topup',
            };
            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: Number(total.toFixed(2)),
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: 'payment-gateway/wallet-payments/payment',
                    earningCashbackAmount:
                        Number(surchargeData && surchargeData?.corporateCashback) ?? 0,
                })
            );

            navigate(paths.dashboard.payments);
        },
        [dispatch, id, navigate, role, username]
    );

    return { handleSubmission };
}
