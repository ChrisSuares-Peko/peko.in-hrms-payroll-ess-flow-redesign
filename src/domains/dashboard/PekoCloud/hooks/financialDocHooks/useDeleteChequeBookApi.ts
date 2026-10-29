import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteChequeBook } from '../../api/financialDoc';

interface useChequeBookDataApiProps {
    handleCancel?: () => void;
}
export const useDeleteChequeBookApi = ({ handleCancel }: useChequeBookDataApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteChequeBookData = useCallback(
        async (chequeBookId: string) => {
            setIsLoading(true);
            const data = await deleteChequeBook({
                userId: id,
                userType: role,
                chequeBookId,
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

    return { deleteChequeBookData, isLoading };
};
