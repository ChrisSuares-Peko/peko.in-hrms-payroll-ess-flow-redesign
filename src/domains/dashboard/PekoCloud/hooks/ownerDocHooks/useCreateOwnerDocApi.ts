import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createOwnerDoc } from '../../api/ownerDoc';

export default function useOwnerDocCreate(handleCancel?: () => void) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleOwnerDocCreation = async (values: any) => {
        setSubmitLoading(true);
        const payload = {
            ...values,
            profilePicture: values.profilepicture
                ? {
                      profileImageBase: values.profileImageBase,
                      profileImageFormat: values.profileImageFormat,
                  }
                : null,
            userId: id,
            userType: role,
        };

        const data = await createOwnerDoc(payload);
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

    return { handleOwnerDocCreation, submitLoading };
}
