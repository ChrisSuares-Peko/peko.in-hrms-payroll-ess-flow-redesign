import { useCallback, useState } from 'react';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { cancelbookings, CancelStatus } from '../Api';

export default function useBookingCancelApi(refetch?: () => void) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const { corporateTxnId } = useAppSelector(state => state.reducer.hotels);
    const [isLoading, setIsLoading] = useState(false);

    const cancelBooked = useCallback(
        async (orderId: number, otp: string, scope: string) => {
            try {
                setIsLoading(true);
                const data: any = await cancelbookings({
                    userId: id,
                    userType: role,
                    orderId,
                    selectedCorporateTxnId: corporateTxnId,
                    otp,
                    scope,
                });
                if (data && data.status) {
                    if (data.data.status === 'Processed') {
                        dispatch(
                            showToast({
                                variant: 'success',
                                description: 'Booking cancelled successfully',
                            })
                        );
                    } else {
                        dispatch(
                            showToast({
                                variant: 'success',
                                description: 'Booking cancellation requested successfully.',
                            })
                        );
                    }
                    return true;
                }
                return false;
            } catch (error) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'An error occurred while cancelling booking.',
                    })
                );
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [id, role, corporateTxnId, dispatch]
    );

    const cancelStatusFetch = useCallback(
        async (orderId: number, txnId: any) => {
            try {
                const data = await CancelStatus({
                    userId: id,
                    userType: role,
                    selectedCorporateTxnId: txnId,
                    orderId,
                });
                if (data && data.status) {
                    dispatch(
                        showToast({
                            variant: 'success',
                            description: 'Cancellation status updated successfully.',
                        })
                    );
                    if (refetch) {
                        refetch();
                    }
                    return true;
                }
                return false;
            } catch (error) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'An error occurred while fetching cancellation status.',
                    })
                );
                return false;
            }
        },
        [id, role, dispatch, refetch]
    );

    return { cancelBooked, loader: isLoading, cancelStatusFetch };
}
