import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteVehicle } from '../../api/fleet';

interface useDeleteVehicleApiProps {
    handleCancel?: () => void;
}
export const useDeleteVehicleApi = ({ handleCancel }: useDeleteVehicleApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteVehicleData = useCallback(
        async (fleetId: string) => {
            setIsLoading(true);
            const data = await deleteVehicle({
                userId: id,
                userType: role,
                fleetId,
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

    return { deleteVehicleData, isLoading };
};
