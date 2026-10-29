import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteAsset } from '../../api/docAndAssetsApi/index';
import { assetDeleteResponse } from '../../types/docAndAssetsTypes';

interface useDeleteOvertimeApiProps {
    handleCancel: () => void;
}

export const useDeleteAssetApi = ({ handleCancel }: useDeleteOvertimeApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();

    const deleteAssetData = async (assetId: string | undefined) => {
        setIsLoading(true);
        const data: assetDeleteResponse | false = await deleteAsset({
            userId: id,
            userType: role,
            assetId,
        });
        if (data) {
            dispatch(
                showToast({
                    description: 'Asset deleted successfully',
                    variant: 'success',
                })
            );
            handleCancel();
        }
        setIsLoading(false);
    };

    return { deleteAssetData, deleteLoader: isLoading };
};
