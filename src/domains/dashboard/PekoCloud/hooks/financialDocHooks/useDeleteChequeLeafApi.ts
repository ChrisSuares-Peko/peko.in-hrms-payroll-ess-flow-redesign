import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteChequeLeaf } from '../../api/financialDoc';

interface useChequeLeafDataApiProps {
    handleCancel?: () => void;
}
export const useDeleteChequeLeafApi = ({ handleCancel }: useChequeLeafDataApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteChequeLeafData = useCallback(
        async (chequeLeafId: string) => {
            setIsLoading(true);
            const data = await deleteChequeLeaf({
                userId: id,
                userType: role,
                chequeLeafId,
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

    return { deleteChequeLeafData, isLoading };
};
