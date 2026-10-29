import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { processRefundApi } from '../../api/domainHostingCancellations';

export default function useProcessRefund(onSuccess: () => void) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const submitRefund = async (corporateTxnId: string, refundAmount: number, remarks: string) => {
        setIsLoading(true);
        const resp = await processRefundApi({
            userType: role,
            userId: id,
            corporateTxnId,
            refundAmount,
            remarks,
        });
        if (resp && typeof resp === 'object' && 'status' in resp && resp.status) {
            dispatch(
                showToast({
                    variant: 'success',
                    description: `Refund of ₹${refundAmount} processed successfully`,
                })
            );
            onSuccess();
        } else {
            const errMsg =
                resp && typeof resp === 'object' && 'message' in resp
                    ? String(resp.message)
                    : 'Failed to process refund. Please try again.';
            dispatch(showToast({ variant: 'error', description: errMsg }));
        }
        setIsLoading(false);
    };

    return { submitRefund, isLoading };
}
