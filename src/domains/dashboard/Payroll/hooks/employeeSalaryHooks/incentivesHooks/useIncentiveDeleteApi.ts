import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteIncentive } from '../../../api/employeeSalaryApi/incentiveApi';

interface useDeleteIncentiveApiProps {
    handleCancel: () => void;
}
export const useDeleteIncentiveApi = ({ handleCancel }: useDeleteIncentiveApiProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [isLoading, setIsLoading] = useState(false);

    const deleteIncentiveData = async (rId: string) => {
        setIsLoading(true);
        const data = await deleteIncentive({
            userId: id,
            userType: role,
            rId,
        });

        if (data) {
            handleCancel();
            dispatch(
                showToast({
                    description: 'Incentive deleted successfully',
                    variant: 'success',
                })
            );
        }
        setIsLoading(false);
    };

    return { deleteIncentiveData, isLoading };
};
