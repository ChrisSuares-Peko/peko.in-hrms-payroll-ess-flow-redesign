import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateVehicleMaintenanceHistory } from '../../api/fleet';

export function useUpdateMaintenanceHistory(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateVehicleMaintenanceData = async (values: any, maintenanceId: number) => {
        setSubmitLoading(true);
        const { receivedDate, ...restValues } = values;

        const payload = {
            ...restValues,
            maintenanceId,
            userId: id,
            userType: role,
            ...(receivedDate !== '' && { receivedDate }),
        };

        const data = await updateVehicleMaintenanceHistory(payload);
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

    return { updateVehicleMaintenanceData, submitLoading };
}
