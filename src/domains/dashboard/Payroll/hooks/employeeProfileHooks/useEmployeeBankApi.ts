import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    updateEmployeeBankDetails,
    createEmployeeBankDetails,
    deleteEmployeeBankDetails,
} from '../../api/employeeProfileApi/index';
import {
    CreateBankDetailsPayload,
    UpdateBankDetailsPayload,
} from '../../types/employeeprofile/types';

export function useEployeeBankApi(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const addBankDetailsAction = useCallback(
        async (payload: CreateBankDetailsPayload) => {
            setIsAdding(true);
            const data = await createEmployeeBankDetails({
                ...payload,
                userId: id,
                userType: role,
                employeeId: payload.employeeId,
            });

            if (data) {
                dispatch(
                    showToast({
                        description: 'Bank Account added successfully',
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

    const updateBankDetailsAction = async (values: UpdateBankDetailsPayload) => {
        const finalPayload = {
            bankId: values.bankId,
            accountName: values.accountName,
            accountNumber: values.accountNumber,
            bankName: values.bankName,
            ifscCode: values.ifscCode,
            isDefaultAccount: values.isDefaultAccount ?? false, // Use optional chaining for default
        };

        const payload = {
            ...finalPayload,
            userId: id,
            userType: role,
        };
        setIsUpdating(true);
        const data = await updateEmployeeBankDetails(payload);
        if (data) {
            handleCancel?.();
            dispatch(
                showToast({
                    description: 'Bank account updated successfully',
                    variant: 'success',
                })
            );
        }
        setIsUpdating(false);
        return data;
    };

    const deleteBankDetailsAction = async (bankId: string) => {
        setIsLoading(true);
        const data = await deleteEmployeeBankDetails({
            userId: id,
            userType: role,
            id: bankId,
        });
        
        if (data && handleCancel) {
             dispatch(
                showToast({
                    description: 'Bank account deleted successfully',
                    variant: 'success',
                })
            );
            handleCancel();
           
        }
        dispatch(
            showToast({
                description: 'Bank account deleted successfully',
                variant: 'success',
            })
        );
        setIsLoading(false);
        return data;
    };

    return {
        addBankDetailsAction,
        updateBankDetailsAction,
        deleteBankDetailsAction,
        isLoading,
        isUpdating,
        isAdding,
    };
}
