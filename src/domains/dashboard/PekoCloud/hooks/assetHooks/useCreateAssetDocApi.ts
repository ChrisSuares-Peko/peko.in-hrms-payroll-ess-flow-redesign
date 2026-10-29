import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createAssetDoc } from '../../api/assets';

export default function useAssetDocCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleAssetDocCreation = async (values: any, cloudAssetId: number) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            cloudAssetId,
            document: values.document
                ? {
                      documentBase: values.documentBase,
                      documentFormat: values.documentFormat,
                  }
                : null,
            userId: id,
            userType: role,
        };

        const data = await createAssetDoc(payload);
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

    return { handleAssetDocCreation, submitLoading };
}
