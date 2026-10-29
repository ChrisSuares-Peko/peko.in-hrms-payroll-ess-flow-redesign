import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createDeductionComponent,
    updateDeductionComponent,
    deleteDeductionComponent,
} from '../../api/organizationSettings/index';
import {
    createDeductionComponentPayload,
    updateDeductionComponentPayload,
} from '../../types/organizationSettings';

export function useDeductionActions(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [deductionDetails, setDeductionDetails] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding] = useState(false);
    const [isUpdating] = useState(false);
    const [isGeneralAdding, setIsGeneralAdding] = useState(false);
    const [isGeneralUpdating, setIsGeneralUpdating] = useState(false);

    const buildPayload = (values: any) => {
        const { calculationType, amountPercentage, ...rest } = values;

        if (calculationType === 'FIXED') {
            return {
                ...rest,
                calculationType,
                amountPercentage,
            };
        }

        if (calculationType === 'PERCENTAGE') {
            return {
                ...rest,
                calculationType,
                amountPercentage,
            };
        }

        return { ...values };
    };

    const addDeductionAction = useCallback(
        async (payload: createDeductionComponentPayload) => {
            const finalPayload = buildPayload(payload);
            setIsGeneralAdding(true);
            const data = await createDeductionComponent({
                ...finalPayload,
                userId: id,
                userType: role,
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
            setIsGeneralAdding(false);
            return data;
        },
        [id, role, dispatch, handleCancel]
    );

    const updateDeductionAction = async (
        values: updateDeductionComponentPayload,
        compId: string
    ) => {
        const finalPayload = buildPayload(values);

        const payload = {
            ...finalPayload,
            id: compId,
            userType: role,
        };
        setIsGeneralUpdating(true);
        const data = await updateDeductionComponent({
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
        setIsGeneralUpdating(false);
        return data;
    };

    const deleteDeductionAction = async (deductionCompId: string) => {
        setIsLoading(true);
        const data = await deleteDeductionComponent({
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
        isUpdating,
        isGeneralAdding,
        isGeneralUpdating,
    };
}
