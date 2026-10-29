import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createEmployeeDeductionComponent,
    updateEmployeeDeductionComponent,
    deleteEmployeeDeductionComponent,
} from '../../api/employeeProfileApi/index';
import {
    createDeductionComponentPayload,
    updateDeductionComponentPayload,
} from '../../types/employeeprofile/types';

export function useDeductionActions(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [deductionDetails, setDeductionDetails] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const addDeductionAction = useCallback(
        async (payload: createDeductionComponentPayload) => {
            setIsAdding(true);
            const data = await createEmployeeDeductionComponent({
                ...payload,
                userId: id,
                userType: role,
                eId: payload.eId,
            });

            if (data) {
                dispatch(
                    showToast({
                        description: 'Deduction component added successfully',
                        variant: 'success',
                    })
                );
                if (handleCancel) handleCancel();
            }
            setIsAdding(false);
            return data;
        },
        [id, role, dispatch, handleCancel]
    );
    const updateDeductionAction = async (
        values: updateDeductionComponentPayload,
        compId: string
    ) => {
        const payload = {
            ...values,
            id: compId,
            userType: role,
        };
        setIsUpdating(true);

        const data = await updateEmployeeDeductionComponent({
            ...payload,
            userId: id,
            userType: role,
        });
        if (data) {
            handleCancel?.();
            dispatch(
                showToast({
                    description: 'Deduction component updated successfully',
                    variant: 'success',
                })
            );
        }
        setIsUpdating(false); 
        return data;
    };

    const deleteDeductionAction = async (deductionCompId: string) => {
        setIsLoading(true);
        const data = await deleteEmployeeDeductionComponent({
            userId: id,
            userType: role,
            id: deductionCompId,
        });
        if (data && handleCancel) {
            handleCancel();
            setDeductionDetails(data);
            dispatch(
                showToast({
                    description: 'Deduction component deleted successfully',
                    variant: 'success',
                })
            );
        }
        setIsLoading(false);
        return data;
    };

    return {
        addDeductionAction,
        updateDeductionAction,
        deleteDeductionAction,
        deductionDetails,
        isLoading,
        isAdding,
        isUpdating
    };
}
