import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';
import { getAddonPricing } from '../../plans/api';
import { formatTaxLabel } from '../../plans/utils';

export default function useVerificationPayment(quantity: number) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setLoading] = useState(false);

    const handleSubmission = useCallback(async () => {
        setLoading(true);
        try {
            const quote = await getAddonPricing({
                userId: id,
                userType: role,
                addonsAccessKey: accessKeys.verificationSuite,
                quantity,
            });
            if (!quote) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Unable to fetch the add-on price. Please try again.',
                    })
                );
                return;
            }

            const billSummary = [
                { key: 'Service name', value: 'Verification Suite Add-on' },
                { key: 'Verifications', value: quantity },
                { key: 'Amount', value: formatNumberWithLocalString(quote.taxableAmount) },
            ];

            const paymentSummary =
                Number(quote.taxAmount) > 0
                    ? [
                          {
                              key: formatTaxLabel(quote.taxRate),
                              value: `₹ ${formatNumberWithLocalString(quote.taxAmount)}`,
                          },
                      ]
                    : [];

            const requestBody = {
                accessKey: accessKeys.verificationSuite,
                quantity,
                amount: quote.taxableAmount,
            };

            dispatch(
                setPaymentData({
                    billSummary,
                    paymentSummary,
                    totalAmount: quote.expectedPaymentAmount,
                    title: 'Verification Suite',
                    payload: requestBody,
                    // Placeholder purchase route — swap once the backend endpoint is confirmed.
                    url: 'officeAndBusiness/verification/v2/add-ons/purchase',
                    navigatePath: `${paths.dashboard.verificationSuite}/${paths.verificationSuite.settings}`,
                })
            );

            navigate(`${paths.dashboard.verificationSuite}/${paths.verificationSuite.reviewOrder}`);
        } finally {
            setLoading(false);
        }
    }, [quantity, id, role, dispatch, navigate]);

    return { handleSubmission, loading };
}
