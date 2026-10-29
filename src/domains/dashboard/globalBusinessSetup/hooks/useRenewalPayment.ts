import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';
import { checkWalletBalance } from '../api/globalBusinessSetup';

interface RenewalPaymentInput {
    renewalId: string;
    baseAmount: number;
    renewalType?: string;
    companyName?: string;
}

// Mirrors useForm.handleProceedToPayment for renewal approve-quote. Only
// differences are the payload flag `isRenewalApproval: true` (so the gateway
// dispatchers route to `globalBusinessSetupRenewalApprove`), and a `renewalId` instead of
// `applicationId`. The rest of the contract — surcharge calc, wallet balance
// check, bill/payment summary, URL — matches the new-setup flow so the shared
// Payments page handles wallet / NI card / Lean uniformly.
export default function useRenewalPayment() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const proceedToPayment = useCallback(
        async ({ renewalId, baseAmount, renewalType, companyName }: RenewalPaymentInput) => {
            if (!renewalId || !baseAmount || baseAmount <= 0) {
                dispatch(
                    showToast({
                        description: 'Renewal quote total is unavailable.',
                        variant: 'error',
                    })
                );
                return;
            }

            let walletResponse;
            try {
                walletResponse = await checkWalletBalance({
                    amount: baseAmount,
                    userId: id,
                    userType: role,
                });
            } catch (err) {
                dispatch(
                    showToast({
                        description: 'Unable to verify wallet balance.',
                        variant: 'error',
                    })
                );
                return;
            }

            if (!walletResponse || walletResponse.status === false) {
                dispatch(
                    showToast({
                        description: walletResponse?.message || 'Insufficient wallet balance',
                        variant: 'error',
                    })
                );
                return;
            }

            const surchargeResponse = await getSurcharge({
                userId: id,
                userType: role,
                amount: baseAmount,
                accessKey: accessKeys.globalBusinessSetup,
            });
            const surcharge = Number(surchargeResponse ? surchargeResponse.surcharge : 0);
            const netAmount = baseAmount + surcharge;

            const billSummary = [
                { key: 'Service name', value: 'Global Business Setup Renewal' },
                ...(renewalType ? [{ key: 'Renewal Type', value: renewalType }] : []),
                ...(companyName ? [{ key: 'Company', value: companyName }] : []),
            ];

            const paymentSummary = [
                {
                    key: 'Subtotal',
                    value: `INR ${formatNumberWithLocalString(baseAmount)}`,
                },
                {
                    key: 'Platform fee (inclusive of VAT)',
                    value: `${formatNumberWithLocalString(surcharge)}`,
                },
            ];

            const payload = {
                renewalId,
                totalAmount: baseAmount,
                accessKey: accessKeys.globalBusinessSetup,
                isRenewalApproval: true,
                payCashback: false,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: netAmount,
                    title: 'Renewal Payment',
                    payload,
                    url: 'payment-gateway/wallet-payments/payment',
                    earningCashbackAmount:
                        (surchargeResponse ? Number(surchargeResponse.corporateCashback) : 0) || 0,
                })
            );

            navigate(paths.dashboard.payments);
        },
        [dispatch, navigate, id, role]
    );

    return { proceedToPayment };
}
