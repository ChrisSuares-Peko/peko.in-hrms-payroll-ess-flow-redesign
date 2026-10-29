import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ownerDocDelete } from '../../api/ownerDoc';

interface useReimbursementApiProps {
    handleCancel?: () => void;
}
export const useDeleteOwnerDocApi = ({ handleCancel }: useReimbursementApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteOwnerDocData = useCallback(
        async (ownerId: string) => {
            setIsLoading(true);
            const data = await ownerDocDelete({
                userId: id,
                userType: role,
                ownerId,
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

    return { deleteOwnerDocData, isLoading };
};
