import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createPaymentForInvoice, getOnboardingStatus } from '../../Procure/api';
import { PayoutTransferResponse } from '../types';

export default function usePayInvoiceApi() {
    const { corporateId, id: userId, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const pay = async (invoiceId: string | number, transferType?: string): Promise<PayoutTransferResponse | null> => {
        setIsSubmitting(true);
        const onboarding = await getOnboardingStatus({ userId, userType: role });
        const virtualAccountNumber = onboarding ? onboarding.virtualAccountNumber : undefined;
        const result = await createPaymentForInvoice({
            corporateId: String(corporateId),
            id: invoiceId,
            transferType,
            virtualAccountNumber,
        });
        if (result) {
            dispatch(showToast({ variant: 'success', description: result.message }));
        }
        setIsSubmitting(false);
        return result ? result.data : null;
    };

    return { pay, isSubmitting };
}
