import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateVehicle } from '../../api/fleet';

export function useUpdateVehicle(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateVehicleData = async (values: any, fleetId: number, cloudEmployeeId: number) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            cloudEmployeeId,
            fleetId,
            userId: id,
            userType: role,
        };
        const data = await updateVehicle(payload);
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
    return { updateVehicleData, submitLoading };
}
