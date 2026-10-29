import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { editDepartmentAPI } from '../../api/departmentApi';
import { departmentEditPayload } from '../../types/departmentTypes/departmentTypes';

export function useEditDepartmentApi(handleCancel: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useAppDispatch();
    const editDepartment = async (payload: departmentEditPayload, departmentId: string) => {
        setIsLoading(true);

        const response = await editDepartmentAPI({
            ...payload,
            userId: id,
            userType: role,
            id: departmentId,
        });

        if (response) {
            setIsLoading(false);
            dispatch(
                showToast({
                    description: `Department data updated successfully`,
                    variant: 'success',
                })
            );
            handleCancel();
            return true;
        }
        setIsLoading(false);
        return false;
    };
    return { editDepartment, isLoading };
}
