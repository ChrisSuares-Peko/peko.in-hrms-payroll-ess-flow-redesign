import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateStatus } from '../../api/collectorKyb';
import { ChangeStatusPayload } from '../../types/collectorKyb';

interface UpdateKybStatusProps {
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    handleCancel: () => void;
}
export default function useUpdateKybStatus({ setRefresh, handleCancel }: UpdateKybStatusProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const dispatch = useAppDispatch();

    const statusUpdate = useCallback(
        async ({ corporateUserId, kybStatus, rejectReason }: ChangeStatusPayload) => {
            setIsLoading(true);
            if (kybStatus !== 'REJECTED') {
                rejectReason = undefined;
            }
            const data: {} | false = await updateStatus({
                userId: id,
                userType: role,
                kybStatus,
                corporateUserId,
                rejectReason,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Status updated successfully',
                        variant: 'success',
                    })
                );
                setRefresh(true);
                handleCancel();
            }
            setIsLoading(false);
        },
        [dispatch, id, role, setRefresh, handleCancel]
    );
    return { statusUpdate, isLoading };
}
