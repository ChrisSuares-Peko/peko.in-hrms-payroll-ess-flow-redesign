import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateStatus } from '../api/corporateTax';

export default function useUpdateCorporateTax() {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [, setRefresh] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(false);

    const dispatch = useAppDispatch();

    const statusUpdate = useCallback(
        async (status?: string, registrationId?: number, remarks?: string, corporateTax?: any) => {
            setIsLoading(true);
            const data: {} | false = await updateStatus({
                userId: id,
                userType: role,
                status,
                remarks,
                registrationId,
                corporateTax,
            });
            if (data) {
                dispatch(
                    showToast({
                        description: 'Status updated successfully',
                        variant: 'success',
                    })
                );
                return true;
            }
            setRefresh(false);
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role]
    );

    return { isLoading, setRefresh, statusUpdate };
}
