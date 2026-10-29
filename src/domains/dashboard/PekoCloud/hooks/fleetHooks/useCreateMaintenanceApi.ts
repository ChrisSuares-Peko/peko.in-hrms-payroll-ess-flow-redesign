import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createVehicleMaintenanceHistory } from '../../api/fleet';

export default function useMaintenanceCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleMaintenanceHistoryCreation = async (values: any, cloudFleetId: number) => {
        setSubmitLoading(true);

        const { receivedDate, ...restValues } = values;

        const payload = {
            ...restValues,
            cloudFleetId,
            userId: id,
            userType: role,
            ...(receivedDate !== '' && { receivedDate }),
        };

        const data = await createVehicleMaintenanceHistory(payload);
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

    return { handleMaintenanceHistoryCreation, submitLoading };
}
