import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useSurchargeDetails from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';
import { setCorporateDetails } from '../slice/paymentSlice';
import { SubscriptionFormData } from '../types/types';

export default function useForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { subscriptionDetails, amount, planId } = useAppSelector(
        state => state.reducer.subscription
    );
    const { surchargeData } = useSurchargeDetails();

    const total =
        (amount ? parseFloat(amount) : 0) +
        (surchargeData?.surcharge ? parseFloat(surchargeData.surcharge) : 0);

    const handleSubmission = useCallback(
        async (values: SubscriptionFormData) => {
            const billSummary = [
                {
                    key: 'Service name',
                    value: 'Softwares',
                },
                {
                    key: 'Software',
                    value: subscriptionDetails.data.name,
                },
                {
                    key: 'Company',
                    value: values.companyName,
                },
                {
                    key: 'Amount',
                    value: formatNumberWithLocalString(amount ?? 0),
                },
            ];

            const paymentSummary = [
                {
                    key: 'Platform fee (inclusive of GST)',
                    value: `₹ ${formatNumberWithLocalString(surchargeData?.surcharge ?? 0)}`,
                },
            ];

            const requestBody = {
                planId,
                amount,
                formDetails: {
                    ...values,
                },
                accessKey: accessKeys.subscriptions,
                currentUrl: window.location.href,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: 'purchase/softwares/payment',
                    earningCashbackAmount:
                        Number(surchargeData && surchargeData?.corporateCashback) || 0,
                })
            );

            navigate(paths.dashboard.payments);
        },
        [amount, dispatch, navigate, planId, subscriptionDetails, surchargeData, total]
    );

    const handleFormSubmit = useCallback(
        async (values: SubscriptionFormData) => {
            dispatch(
                setCorporateDetails({
                    companyName: values.companyName,
                    domainName: values.domainName,
                    adminEmail: values.adminEmail,
                })
            );
        },
        [dispatch]
    );
    return { handleSubmission, handleFormSubmit };
}
