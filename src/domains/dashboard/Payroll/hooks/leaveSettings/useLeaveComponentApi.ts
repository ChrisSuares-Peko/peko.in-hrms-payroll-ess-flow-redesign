import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createEmployeeLeaveComponent } from '../../api/employeeProfileApi';
import {
    createLeaveComponent,
    updateLeaveComponent,
    deleteLeaveComponent,
} from '../../api/leaveSettings';
import { CreateEmployeeLeaveComponentPayload } from '../../types/employeeprofile/type';
import {
    CreateLeaveComponentPayload,
    UpdateLeaveComponentPayload,
} from '../../types/organizationSettings/index';

export function useLeaveActions(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [leaveDetails, setLeaveDetails] = useState<any>();
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEmployeeAdding, setIsEmployeeAdding] = useState(false);

    const addLeaveAction = useCallback(
        async (payload: CreateLeaveComponentPayload) => {
            const data = await createLeaveComponent({
                ...payload,
                userId: id,
                userType: role,
            });
            setIsAdding(true);
            if (data) {
                dispatch(
                    showToast({
                        description: 'Leave policy added successfully',
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

    const addEmployeeLeaveAction = useCallback(
        async (payload: CreateEmployeeLeaveComponentPayload) => {
            setIsEmployeeAdding(true);
            const data = await createEmployeeLeaveComponent({
                ...payload,
                userId: id,
                userType: role,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Leave policy added successfully',
                        variant: 'success',
                    })
                );
                if (handleCancel) handleCancel();
            }
            setIsEmployeeAdding(false);
            return data;
        },
        [id, role, dispatch, handleCancel]
    );

    const updateLeaveAction = async (values: UpdateLeaveComponentPayload, compId: string) => {
        const cleanedValues = { ...values };

        if (values.accrualType === 'FIXED') {
            delete cleanedValues.maximumAccrual;
        }

        const payload = {
            ...cleanedValues,
            id: compId,
            userType: role,
        };
        setIsUpdating(true);
        const data = await updateLeaveComponent({
            ...payload,
            userId: id,
            userType: role,
        });

        if (data) {
            handleCancel?.();
            dispatch(
                showToast({
                    description: 'Leave policy updated successfully',
                    variant: 'success',
                })
            );
        }
        setIsUpdating(false);
        return data;
    };

    const deleteLeaveAction = async (leaveCompId: string) => {
        setIsLoading(true);
        const data = await deleteLeaveComponent({
            userId: id,
            userType: role,
            id: leaveCompId,
        });
        if (data && handleCancel) {
            handleCancel();
            setLeaveDetails(data);
            dispatch(
                showToast({
                    description: 'Leave policy deleted successfully',
                    variant: 'success',
                })
            );
        }
        setIsLoading(false);
        return data;
    };

    return {
        addLeaveAction,
        updateLeaveAction,
        deleteLeaveAction,
        addEmployeeLeaveAction,
        leaveDetails,
        isLoading,
        isAdding,
        isUpdating,
        isEmployeeAdding,
    };
}
