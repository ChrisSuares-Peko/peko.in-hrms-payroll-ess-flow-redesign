import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateUsageHistory } from '../../api/assets';

export function useUpdateUsageHistory(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateAssetUsageData = async (
        values: any,
        usageId: number,
        cloudAssetId: number,
        empId: number
    ) => {
        setSubmitLoading(true);
        const { returnDate, ...restValues } = values;

        const payload = {
            ...restValues,
            usageId,
            cloudAssetId,
            userId: id,
            userType: role,
            ...(returnDate !== '' && { returnDate }),
        };

        const data = await updateUsageHistory(payload);
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

    return { updateAssetUsageData, submitLoading };
}
