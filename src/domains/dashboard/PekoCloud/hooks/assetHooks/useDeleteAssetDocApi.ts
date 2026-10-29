import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteAssetDoc } from '../../api/assets';

interface useAssetDocApiProps {
    handleCancel?: () => void;
}
export const useDeleteAssetDocApi = ({ handleCancel }: useAssetDocApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteAssetDocData = useCallback(
        async (docId: string) => {
            setIsLoading(true);
            const data = await deleteAssetDoc({
                userId: id,
                userType: role,
                docId,
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

    return { deleteAssetDocData, isLoading };
};
