import { useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createNupayPaymentLinkApi } from '../../api/collectPayment';
import { SendPaymentLinkFormValues } from '../../types/CollectPayment';

const useSendPaymentLink = (documentId?: string) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const generatePaymentLink = async (
        values: SendPaymentLinkFormValues,
        onSuccess: (values: SendPaymentLinkFormValues, paymentLink: string, expiresAt?: string) => void
    ) => {
        setIsLoading(true);

        // NuPay sets a fixed expiry (no custom expiry) — we surface the real expiresAt it returns.
        const resp = await createNupayPaymentLinkApi({
            userId,
            userType,
            amount: values.amount,
            customerName: values.customerName || undefined,
            customerPhone: values.customerPhone || undefined,
            invoiceId: documentId,
        });
        setIsLoading(false);
        if (resp && resp.status && resp.data?.paymentLink) {
            onSuccess(values, resp.data.paymentLink, resp.data.expiresAt);
        } else {
            dispatch(
                showToast({
                    description: (resp && resp.message) || 'Failed to create payment link.',
                    variant: 'error',
                })
            );
        }
    };

    return { generatePaymentLink, isLoading };
};

export default useSendPaymentLink;
