import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createVehicleUsageHistory } from '../../api/fleet';

export default function useVehicleUsageHistoryCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleVehicleUsageHistoryCreation = async (
        values: any,
        fleetId: number,
        existUsageId?: number
    ) => {
        setSubmitLoading(true);
        const {
            existReturnStatus,
            newEmployeeId,
            newAssignDate,
            existReturnDate,
            existRemarks,
            ...restValues
        } = values;

        const payload = {
            ...restValues,
            fleetId,
            userId: id,
            userType: role,
            ...(existUsageId !== undefined && { existUsageId }),
            ...(existReturnStatus !== '' && { existReturnStatus }),
            ...(newEmployeeId !== '' && { newEmployeeId }),
            ...(newAssignDate !== '' && { newAssignDate }),
            ...(existReturnDate !== '' && { existReturnDate }),
            ...(existRemarks !== '' && { existRemarks }),
        };

        const data = await createVehicleUsageHistory(payload);
        if (data && data.data) {
            dispatch(
                showToast({
                    description: data.message,
                    variant: 'success',
                })
            );
            if (handleCancel) {
                handleCancel();
            }
        }
        setSubmitLoading(false);

        return data;
    };

    return { handleVehicleUsageHistoryCreation, submitLoading };
}
