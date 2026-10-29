import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteUsageHistory } from '../../api/assets';

interface useAssetDocApiProps {
    handleCancel?: () => void;
}
export const useDeleteUsageHistoryApi = ({ handleCancel }: useAssetDocApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteUsageHistoryData = useCallback(
        async (usageId: string) => {
            setIsLoading(true);
            const data = await deleteUsageHistory({
                userId: id,
                userType: role,
                usageId,
            });
            if (data && data.data && handleCancel) {
                dispatch(
                    showToast({
                        description: data.message,
                        variant: 'success',
                    })
                );
                handleCancel();
            }
            setIsLoading(false);
        },
        [dispatch, handleCancel, id, role]
    );

    return { deleteUsageHistoryData, isLoading };
};
