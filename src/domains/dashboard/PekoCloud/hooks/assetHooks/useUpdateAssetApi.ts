import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateAsset } from '../../api/assets';

export function useUpdateAsset(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateAssetData = async (values: any, assetId: number, cloudEmployeeId: number) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            cloudEmployeeId,
            purchasedDate: values?.purchasedDate !== '' ? values?.purchasedDate : null,
            assetId,
            userId: id,
            userType: role,
        };
        const data = await updateAsset(payload);
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
    return { updateAssetData, submitLoading };
}
