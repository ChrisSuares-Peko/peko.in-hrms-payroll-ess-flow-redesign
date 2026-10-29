import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { statusUpdate } from '../api/index';

export default function useTracker() {
    const { id, role } = useAppSelector(store => store.reducer.auth);
    const dispatch = useDispatch();

    const updateStatus = useCallback(
        async (value: string, invoiceId: number) => {
            const response: any = await statusUpdate({
                userId: id,
                userType: role,
                status: value,
                id: invoiceId,
            });

            if (response) {
                dispatch(
                    showToast({
                        description: 'Status updated successfully',
                        variant: 'success',
                    })
                );
            }
            return response;
        },
        [dispatch, id, role]
    );

    return { updateStatus };
}
