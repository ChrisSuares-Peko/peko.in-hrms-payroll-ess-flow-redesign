import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteVehicleMaintenanceHistory } from '../../api/fleet';

interface useVehicleApiProps {
    handleCancel?: () => void;
}
export const useDeleteMaintenanceHistoryApi = ({ handleCancel }: useVehicleApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteVehicleMaintanceData = useCallback(
        async (maintenanceId: string) => {
            setIsLoading(true);
            const data = await deleteVehicleMaintenanceHistory({
                userId: id,
                userType: role,
                maintenanceId,
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

    return { deleteVehicleMaintanceData, isLoading };
};
