import { useState, useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteCompanyDoc } from '../../api/companyDoc';

interface useReimbursementApiProps {
    handleCancel?: () => void;
}
export const useDeleteCompanyDocApi = ({ handleCancel }: useReimbursementApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const deleteCompanyDocData = useCallback(
        async (docId: string) => {
            setIsLoading(true);
            const data = await deleteCompanyDoc({
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

    return { deleteCompanyDocData, isLoading };
};
