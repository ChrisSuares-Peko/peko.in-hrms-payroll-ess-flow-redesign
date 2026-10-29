import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateVehicleUsageHistory } from '../../api/fleet';

export function useUpdateVehicleUsageHistory(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateVehicleUsageData = async (
        values: any,
        usageId: number,
        cloudFleetId: number,
        cloudEmployeeId: number
    ) => {
        setSubmitLoading(true);
        const { returnDate, ...restValues } = values;

        const payload: any = {
            ...restValues,
            cloudFleetId,
            usageId,
            userId: id,
            userType: role,
            ...(returnDate !== '' && { returnDate }),
        };

        const data = await updateVehicleUsageHistory(payload);
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
    };

    return { updateVehicleUsageData, submitLoading };
}
