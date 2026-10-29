import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteAsset } from '../../api/assets';

interface useVehicleApiProps {
    handleCancel?: () => void;
}
export const useDeleteAssetApi = ({ handleCancel }: useVehicleApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteAssetData = useCallback(
        async (assetId: string) => {
            setIsLoading(true);
            const data = await deleteAsset({
                userId: id,
                userType: role,
                assetId,
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

    return { deleteAssetData, isLoading };
};
