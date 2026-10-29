import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { ownerDocUpdate } from '../../api/ownerDoc';

export function useUpdateOwnerDoc(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const updateOwnerDoc = async (values: any, selectedData: any) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            ownerId: selectedData.ownerId,
            userId: id,
            userType: role,
        };
        if (values.profilePicture) {
            payload.profilePicture = values.profilePicture?.profileImageFormat
                ? {
                      profileImageBase: values.profileImageBase,
                      profileImageFormat: values.profileImageFormat,
                  }
                : values.profilePicture;
        }

        const data = await ownerDocUpdate(payload);
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

    return { updateOwnerDoc, submitLoading };
}
