import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createVehicle } from '../../api/fleet';

export default function useVehicleCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleVehicleCreation = async (values: any) => {
        setSubmitLoading(true);

        const payload = {
            ...values,
            userId: id,
            userType: role,
        };

        const data = await createVehicle(payload);
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

    return { handleVehicleCreation, submitLoading };
}
