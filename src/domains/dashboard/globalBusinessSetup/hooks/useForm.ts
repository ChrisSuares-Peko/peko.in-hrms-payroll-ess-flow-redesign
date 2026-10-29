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
import { QuoteConfig } from '../types/pricing';

type UsePaymentSummaryParams = {
    applicationId: string;
    applicationNo?: string;
    providerTitle: string;
    baseAmount: number;
    pricingId?: string;
    quoteConfig?: QuoteConfig | null;
    metrics: {
        visa: number;
        shareholder: number;
        activity: number;
    };
    freezone: string;
    country: string;
    type: string;
    // Native pricing currency + its INR rate (units per 1 INR). Pricing is shown
    // native everywhere; the INR conversion happens here, at the payment step.
    currency?: string;
    inrRate?: number;
};

export default function usePaymentSummary({
    applicationId,
    applicationNo,
    providerTitle,
    baseAmount,
    pricingId,
    quoteConfig,
    metrics,
    freezone,
    type,
    country,
    currency,
    inrRate,
}: UsePaymentSummaryParams) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const handleProceedToPayment = useCallback(async () => {
        if (!applicationId || !metrics) {
            console.warn('Payment summary data not ready');
            return;
        }

        // Convert the native-currency total to INR — the only place conversion
        // happens. Everything downstream (wallet check, surcharge, gateway,
        // invoice) is INR. Block if a non-INR currency has no configured rate
        // rather than charging a wrong amount.
        const isAed = !currency || currency.toUpperCase() === 'INR';
        if (!isAed && (!inrRate || inrRate <= 0)) {
            dispatch(
                showToast({
                    description: `Exchange rate for ${currency} is not configured. Please contact support.`,
                    variant: 'error',
                })
            );
            return;
        }
        const rate = isAed ? 1 : (inrRate as number);
        const aedBase = Math.round((baseAmount / rate) * 100) / 100;

        let walletResponse;

        try {
            walletResponse = await checkWalletBalance({
                amount: aedBase,
                userId: id,
                userType: role,
            });
        } catch (err) {
            console.error('Wallet balance API failed', err);
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
            amount: aedBase,
            accessKey: accessKeys.globalBusinessSetup,
        });
        const surcharge = Number(surchargeResponse ? surchargeResponse.surcharge : 0);
        const netAmount = aedBase + surcharge;

        const billSummary = [
            { key: 'Service name', value: 'Global Business Setup' },
            { key: 'Provider', value: providerTitle || 'N/A' },
            { key: 'Application No.', value: applicationNo || applicationId },
        ];

        const paymentSummary = [
            {
                key: 'Subtotal',
                value: `INR ${formatNumberWithLocalString(aedBase)}`,
            },
            {
                key: 'Platform fee (inclusive of VAT)',
                value: `${formatNumberWithLocalString(surcharge)}`,
            },
        ];

        const payload = {
            applicationId,
            // `applicationId` above is the Mongo _id Base93 needs at the vendor
            // endpoint; `application_no` is the user-readable identifier that
            // the success page/email should display. Gateway echoes it back via
            // orderResponse so downstream screens can show it.
            application_no: applicationNo || applicationId,
            totalAmount: aedBase,
            accessKey: accessKeys.globalBusinessSetup,
            payCashback: false,
            freezone,
            type,
            country,
            metrics,
            ...(pricingId ? { pricingId } : {}),
            ...(quoteConfig ? { quoteConfig } : {}),
        };

        dispatch(
            setPaymentData({
                billSummary,
                paymentSummary,
                totalAmount: netAmount,
                title: 'Payment Summary',
                payload,
                url: 'payment-gateway/wallet-payments/payment',
                earningCashbackAmount:
                    (surchargeResponse ? Number(surchargeResponse.corporateCashback) : 0) || 0,
            })
        );

        navigate(paths.dashboard.payments);
    }, [
        applicationId,
        applicationNo,
        providerTitle,
        baseAmount,
        pricingId,
        quoteConfig,
        metrics,
        freezone,
        type,
        country,
        currency,
        inrRate,
        dispatch,
        navigate,
        id,
        role,
    ]);

    return { handleProceedToPayment };
}
