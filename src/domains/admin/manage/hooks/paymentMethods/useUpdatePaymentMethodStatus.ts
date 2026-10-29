import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updatePaymentMethodStatusApi } from '../../api/paymentMethods';

type Props = {
    onUpdated: () => void;
};

const useUpdatePaymentMethodStatus = ({ onUpdated }: Props) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const dispatch = useAppDispatch();

    const updateStatus = useCallback(
        async (paymentMethodId: number, isActive: boolean) => {
            setUpdatingId(paymentMethodId);
            const data = await updatePaymentMethodStatusApi({
                userId: id,
                userType: role,
                paymentMethodId,
                isActive,
            });
            if (data) {
                onUpdated();
                dispatch(
                    showToast({
                        description: isActive
                            ? 'Payment method enabled successfully'
                            : 'Payment method disabled successfully',
                        variant: 'success',
                    })
                );
            }
            setUpdatingId(null);
            return Boolean(data);
        },
        [id, role, dispatch, onUpdated]
    );

    return { updateStatus, updatingId };
};

export default useUpdatePaymentMethodStatus;
