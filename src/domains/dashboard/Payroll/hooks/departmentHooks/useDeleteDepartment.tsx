import { useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { deleteDepartmentAPI } from '../../api/departmentApi';

interface DeleteDepartmentProps {
    handleCancel?: () => void;
}
export function useDeleteDepartmentApi({ handleCancel }: DeleteDepartmentProps) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const deleteDepartment = async (departmentId: string | number) => {
        setIsLoading(true);

        const response = await deleteDepartmentAPI({
            userId: id,
            userType: role,
            departmentId,
        });

        if (response && handleCancel) {
            setIsLoading(false);
            handleCancel();
            return true;
        }
        setIsLoading(false);
        return false;
    };
    return { deleteDepartment, isLoading };
}
