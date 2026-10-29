import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteVehicleUsageHistory } from '../../api/fleet';

interface useVehicleApiProps {
    handleCancel?: () => void;
}
export const useDeleteVehicleUsageApi = ({ handleCancel }: useVehicleApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteVehicleUsageData = useCallback(
        async (usageId: string) => {
            setIsLoading(true);
            const data = await deleteVehicleUsageHistory({
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

    return { deleteVehicleUsageData, isLoading };
};
