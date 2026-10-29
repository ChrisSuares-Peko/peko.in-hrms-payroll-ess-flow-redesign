import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { FRONTEND_BASE_URL, PAYMENT_FAiLURE_URL } from '@src/config-global';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import GetSurcharge from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';
import { resetWhatsappBusinessState } from '../slices/paymentSlice';

export default function useBotBuilderPayment() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { getSurchargeData } = GetSurcharge();

    const handleSubmission = useCallback(
        async (amount: string, projectId: string) => {
            const surchargeData = await getSurchargeData(amount);

            const total =
                (amount ? parseFloat(amount) : 0) +
                (surchargeData?.surcharge ? parseFloat(surchargeData.surcharge) : 0);

            const billSummary = [
                {
                    key: 'Service name',
                    value: 'WhatsApp for Business',
                },
                {
                    key: 'Add-on',
                    value: 'Bot Builder',
                },
                {
                    key: 'Amount',
                    value: formatNumberWithLocalString(amount),
                },
            ];

            const paymentSummary = [
                {
                    key: 'Platform fee (inclusive of VAT)',
                    value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
                },
            ];

            const successPath = `${paths.dashboard.whatsappForBusiness}/${paths.whatsappForBusiness.successPage}`;

            const requestBody = {
                amount,
                project_id: projectId,
                isAddOns: true,
                accessKey: accessKeys.whatsappBasic,
                successUrl: `${FRONTEND_BASE_URL}${successPath}`,
                failureUrl: PAYMENT_FAiLURE_URL,
                currentUrl: window.location.href,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: '',
                    successPath,
                    earningCashbackAmount: Number(surchargeData?.corporateCashback) || 0,
                })
            );

            // Every checkout-initiating flow must (re)set this — the generic checkout mechanism in
            // payments/hooks/usePaymentApi.ts only clears it once a checkout event actually fires,
            // so skipping this here would let a leftover value from an abandoned purchase on a
            // totally different service (e.g. Gift Cards) get picked up as this checkout's data.
            sessionStorage.setItem(
                'service_details',
                JSON.stringify({
                    serviceDetails: { moengage_prefix: 'whatsapp_for_business' },
                })
            );

            navigate(paths.dashboard.payments);
            dispatch(resetWhatsappBusinessState());
        },
        [dispatch, navigate, getSurchargeData]
    );

    return { handleSubmission };
}
