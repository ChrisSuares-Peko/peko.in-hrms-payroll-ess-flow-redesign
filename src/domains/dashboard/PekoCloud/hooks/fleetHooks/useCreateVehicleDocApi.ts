import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createVehicleDoc } from '../../api/fleet';

export default function useVehicleDocCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleVehicleDocCreation = async (values: any, cloudFleetId: number) => {
        setSubmitLoading(true);

        const payload = {
            ...values,
            cloudFleetId,
            document: values.document
                ? {
                      documentBase: values.documentBase,
                      documentFormat: values.documentFormat,
                  }
                : null,
            userId: id,
            userType: role,
        };

        const data = await createVehicleDoc(payload);
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

    return { handleVehicleDocCreation, submitLoading };
}
