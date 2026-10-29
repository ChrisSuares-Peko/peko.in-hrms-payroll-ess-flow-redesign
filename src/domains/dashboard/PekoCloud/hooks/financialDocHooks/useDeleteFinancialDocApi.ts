import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteFinancialDoc } from '../../api/financialDoc';

interface useReimbursementApiProps {
    handleCancel?: () => void;
}
export const useDeleteFinancialDocApi = ({ handleCancel }: useReimbursementApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteFinacialDocData = useCallback(
        async (docId: string) => {
            setIsLoading(true);
            const data = await deleteFinancialDoc({
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

    return { deleteFinacialDocData, isLoading };
};
