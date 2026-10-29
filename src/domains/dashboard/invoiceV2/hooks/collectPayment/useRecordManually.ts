import { useCallback, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { recordManualPaymentApi } from '../../api/invoices';
import { RecordManuallyFormValues } from '../../types/CollectPayment';

const useRecordManually = (invoiceId?: string) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const savePayment = useCallback(
        async (values: RecordManuallyFormValues, onSuccess: () => void) => {
            if (!invoiceId) return;
            setIsLoading(true);
            const resp = await recordManualPaymentApi({
                userId: id,
                userType: role,
                invoiceId,
                amount: Number(values.amountPaid),
                paymentMethod: values.paymentMethod,
                paymentDate: values.paymentDate ?? '',
                referenceId: values.referenceId || undefined,
                notes: values.notes || undefined,
            });
            if (resp && resp.status) {
                dispatch(
                    showToast({ description: 'Payment recorded successfully.', variant: 'success' })
                );
                onSuccess();
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
        },
        [id, role, invoiceId, dispatch]
    );

    return { savePayment, isLoading };
};

export default useRecordManually;
