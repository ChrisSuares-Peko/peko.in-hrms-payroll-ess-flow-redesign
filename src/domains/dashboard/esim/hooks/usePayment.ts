import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setEsimPaymentLoading, setPaymentData } from '../../payments/slices/payment';
import { getPlanDetails } from '../api/index';
import { InnerPlan, MultiOrderPayload } from '../types/index';
import { convertMBtoGB, formatPlanName } from '../utils/helperFunction';

type VendorGroup = {
    plans: InnerPlan[];
    orders: MultiOrderPayload['orders'][number][];
    amount: number;
    quantity: number;
};

export default function usePayment() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const handleSubmission = useCallback(
        async (values: MultiOrderPayload) => {
            dispatch(setEsimPaymentLoading(true));
            navigate(paths.dashboard.payments);

            const data = await getPlanDetails({
                userId: id,
                userType: role,
                orders: values.orders,
            });

            if (!data) {
                dispatch(setEsimPaymentLoading(false));
                navigate(-1);
                return;
            }

            const { plans, totalQuantity } = data;

            // Group plans by vendor. plans[i] corresponds to values.orders[i].
            const vendorGroupMap: Record<string, VendorGroup> = {};
            plans.forEach((plan, idx) => {
                const key = plan.provider === 'tunz' ? 'tunz' : 'omega';
                if (!vendorGroupMap[key]) {
                    vendorGroupMap[key] = { plans: [], orders: [], amount: 0, quantity: 0 };
                }
                vendorGroupMap[key].plans.push(plan);
                vendorGroupMap[key].orders.push(values.orders[idx]);
                vendorGroupMap[key].amount += plan.totalAmount;
                // Use order quantity, not plan quantity
                vendorGroupMap[key].quantity += values.orders[idx].quantity || 1;
            });

            const vendorKeys = Object.keys(vendorGroupMap);
            const isMixed = vendorKeys.length > 1;

            // Parallel surcharge calls — one per vendor with vendor-specific amount
            const surchargeResults = await Promise.all(
                vendorKeys.map(vendor =>
                    getSurcharge({
                        userId: id,
                        userType: role,
                        accessKey: vendor === 'tunz' ? accessKeys.eSimTunz : accessKeys.eSim,
                        amount: Number(vendorGroupMap[vendor].amount.toFixed(2)),
                        quantity: vendorGroupMap[vendor].quantity,
                    })
                )
            );

            const totalSurcharge = surchargeResults.reduce(
                (sum, s) => sum + (s && 'surcharge' in s ? parseFloat(s.surcharge) : 0),
                0
            );
            const subtotal = plans.reduce((sum, p) => sum + p.totalAmount, 0);
            const roundedSubtotal = Number(subtotal.toFixed(2));
            const total = Number((subtotal + totalSurcharge).toFixed(2));

            const billSummary = [
                { key: 'Service name', value: 'eSIM' },
                ...plans.map((plan, idx) => ({
                    key: `Plan ${idx + 1}`,
                    value:
                        plan.provider === 'tunz'
                            ? plan.name
                            : formatPlanName(
                                  `${plan.country}_${convertMBtoGB(plan.dataMBs)}GB_${plan.periodDays}_d`
                              ),
                })),
                {
                    key: 'Amount',
                    value: formatNumberWithLocalString(roundedSubtotal),
                },
            ];

            const paymentSummary = [
                {
                    key: 'Platform fee (inclusive of GST)',
                    value: `₹ ${formatNumberWithLocalString(totalSurcharge)}`,
                },
            ];

            const requestBody = isMixed
                ? {
                      orderGroups: vendorKeys.map((vendor, i) => {
                          const vendorSurcharge =
                              surchargeResults[i] && 'surcharge' in surchargeResults[i]
                                  ? parseFloat(
                                        (surchargeResults[i] as { surcharge: string }).surcharge
                                    )
                                  : 0;
                          const vendorBase = Number(vendorGroupMap[vendor].amount.toFixed(2));
                          return {
                              accessKey: vendor === 'tunz' ? accessKeys.eSimTunz : accessKeys.eSim,
                              amount: vendorBase,
                              surcharge: vendorSurcharge,
                              pgAmount: Number((vendorBase + vendorSurcharge).toFixed(2)),
                              quantity: vendorGroupMap[vendor].quantity,
                              orders: vendorGroupMap[vendor].orders,
                              planIds: vendorGroupMap[vendor].plans.map((p: InnerPlan) => p.planId),
                          };
                      }),
                      amount: roundedSubtotal, // base amount only (surcharge is in orderGroups)
                      pgAmount: total, // total with surcharge
                      currentUrl: window.location.href,
                      ...(values.purchasingFor &&
                          values.purchasingFor.type !== 'self' && {
                              purchasingFor: values.purchasingFor,
                          }),
                  }
                : {
                      amount: roundedSubtotal,
                      surcharge: totalSurcharge,
                      totalAmount: total,
                      quantity: totalQuantity,
                      accessKey: vendorKeys[0] === 'tunz' ? accessKeys.eSimTunz : accessKeys.eSim,
                      currentUrl: window.location.href,
                      orders: values.orders,
                      planIds: plans.map((p: InnerPlan) => p.planId),
                      ...(values.purchasingFor &&
                          values.purchasingFor.type !== 'self' && {
                              purchasingFor: values.purchasingFor,
                          }),
                  };

            const earningCashbackAmount = surchargeResults.reduce(
                (sum, s) => sum + (s && 'corporateCashback' in s ? Number(s.corporateCashback) : 0),
                0
            );

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: 'payment-gateway/wallet-payments/payment',
                    earningCashbackAmount,
                })
            );
            dispatch(setEsimPaymentLoading(false));
        },
        [dispatch, id, navigate, role]
    );

    return { handleSubmission };
}
