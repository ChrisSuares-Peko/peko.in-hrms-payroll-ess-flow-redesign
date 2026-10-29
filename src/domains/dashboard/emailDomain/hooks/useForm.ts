import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import useSurchargeDetails from './useSurchargeApi';
import { setPaymentData } from '../../payments/slices/payment';
import { setData } from '../slices/businessEmailSlice';
import { EmailDomainFormData } from '../types/types';

export default function useForm() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { surchargeData, getSurchargeData } = useSurchargeDetails();

    const handleFormSubmit = useCallback(
        (values: EmailDomainFormData) => {
            dispatch(setData(values));
        },
        [dispatch]
    );

    const handleSubmission = useCallback(
        async ({
            amount,
            formData,
            planId,
            selectedType,
            planName,
        }: {
            formData: EmailDomainFormData;
            amount: string;
            planId: number;
            selectedType: string;
            planName: string;
        }) => {
            const noOfUsers = formData.numberOfUsers || 1;
            const totalAmountForUsers = (parseFloat(amount) || 0) * noOfUsers;
            const surcharge = await getSurchargeData(totalAmountForUsers);
            if (!surcharge) {
                return;
            }
            const total =
                totalAmountForUsers + (surcharge?.surcharge ? parseFloat(surcharge.surcharge) : 0);
            const billSummary = [
                {
                    key: 'Service name',
                    value: 'Business Emails',
                },
                {
                    key: 'Plan',
                    value: planName,
                },
                {
                    key: 'Amount',
                    value: formatNumberWithLocalString(totalAmountForUsers ?? 0),
                },
            ];

            const paymentSummary = [
                {
                    key: 'Platform fee (inclusive of GST)',
                    value: `₹ ${formatNumberWithLocalString(surcharge?.surcharge ?? 0)}`,
                },
            ];

            const requestBody = {
                planId,
                amount: totalAmountForUsers,
                billingType: selectedType === 'Monthly' ? 'MONTHLY' : 'ANNUALLY',
                formDetails: formData,
                accessKey: accessKeys.emailDomain,
                currentUrl: window.location.href,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: total,
                    title: 'Bill Summary',
                    payload: requestBody,
                    url: 'purchase/software-subscriptions/payment',
                    earningCashbackAmount:
                        Number(surchargeData && surchargeData?.corporateCashback) || 0,
                })
            );

            navigate(paths.dashboard.payments);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dispatch, navigate, surchargeData]
    );

    return { handleSubmission, handleFormSubmit };
}
